//+------------------------------------------------------------------+
//|                                               TradeExecution.mqh |
//|                                  Apex AI Trader Order Execution  |
//|               Robust Fills, Slippage Control & Duplicate Guard   |
//+------------------------------------------------------------------+
#property copyright "Apex AI Quantitative Team"
#property link      "https://apexaitrader.internal"
#property strict

#include <Trade\Trade.mqh>

struct S_OrderRequest
{
   string            symbol;
   ENUM_ORDER_TYPE   orderType;
   double            volume;
   double            price;
   double            stopLoss;
   double            takeProfit;
   string            strategyName;
   int               strategyId;
   string            regimeTag;
   int               maxSlippagePoints;
};

struct S_OrderResponse
{
   bool              success;
   ulong             orderTicket;
   ulong             positionTicket;
   double            executedPrice;
   double            slippagePoints;
   string            brokerComment;
   uint              retcode;
};

class CTradeExecution
{
private:
   CTrade            m_trade;
   ulong             m_magicNumber;
   datetime          m_lastOrderTime;
   int               m_maxRetryAttempts;

public:
   CTradeExecution();
   ~CTradeExecution();

   void              Init(ulong magicNumber, int maxDeviationPoints = 10);
   bool              IsDuplicateOrderPending(const string symbol, const int strategyId, int windowSeconds = 60);
   S_OrderResponse   ExecuteMarketOrder(const S_OrderRequest &req);
   bool              ClosePosition(ulong ticket, string reason = "Normal Exit");
   bool              CloseAllPositions(string reason = "Emergency Stop");

private:
   ENUM_ORDER_TYPE_FILLING GetOptimalFilling(const string symbol);
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CTradeExecution::CTradeExecution()
{
   m_magicNumber = 100991;
   m_lastOrderTime = 0;
   m_maxRetryAttempts = 3;
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CTradeExecution::~CTradeExecution()
{
}

//+------------------------------------------------------------------+
//| Initialize Trade Interface                                       |
//+------------------------------------------------------------------+
void CTradeExecution::Init(ulong magicNumber, int maxDeviationPoints)
{
   m_magicNumber = magicNumber;
   m_trade.SetExpertMagicNumber(magicNumber);
   m_trade.SetDeviationInPoints(maxDeviationPoints);
   m_trade.SetAsyncMode(false); // Synchronous execution to confirm fill state
}

//+------------------------------------------------------------------+
//| Prevent Duplicate Orders during reconnects or fast ticks         |
//+------------------------------------------------------------------+
bool CTradeExecution::IsDuplicateOrderPending(const string symbol, const int strategyId, int windowSeconds)
{
   // 1. Time throttle: avoid firing multiple orders within minimal window
   if(TimeCurrent() - m_lastOrderTime < 5)
   {
      return true; // Throttle fast duplicate bursts
   }

   // 2. Check open positions with same magic and strategy tag
   string stratTag = StringFormat("S%d", strategyId);
   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0) continue;
      if(PositionGetInteger(POSITION_MAGIC) == (long)m_magicNumber)
      {
         if(PositionGetString(POSITION_SYMBOL) == symbol)
         {
            string comment = PositionGetString(POSITION_COMMENT);
            if(StringFind(comment, stratTag) >= 0)
            {
               // Position with this exact strategy already open on this symbol
               return true;
            }
         }
      }
   }

   // 3. Check pending orders
   for(int i = 0; i < OrdersTotal(); i++)
   {
      ulong ticket = OrderGetTicket(i);
      if(ticket <= 0) continue;
      if(OrderGetInteger(ORDER_MAGIC) == (long)m_magicNumber)
      {
         if(OrderGetString(ORDER_SYMBOL) == symbol)
         {
            return true;
         }
      }
   }

   return false;
}

//+------------------------------------------------------------------+
//| Determine Optimal Filling Mode for Broker Symbol                 |
//+------------------------------------------------------------------+
ENUM_ORDER_TYPE_FILLING CTradeExecution::GetOptimalFilling(const string symbol)
{
   uint fillingMode = (uint)SymbolInfoInteger(symbol, SYMBOL_FILLING_MODE);
   if((fillingMode & SYMBOL_FILLING_FOK) != 0) return ORDER_FILLING_FOK;
   if((fillingMode & SYMBOL_FILLING_IOC) != 0) return ORDER_FILLING_IOC;
   return ORDER_FILLING_RETURN;
}

//+------------------------------------------------------------------+
//| Execute Market Order with Retries and Slippage Measurement       |
//+------------------------------------------------------------------+
S_OrderResponse CTradeExecution::ExecuteMarketOrder(const S_OrderRequest &req)
{
   S_OrderResponse resp;
   resp.success = false;
   resp.orderTicket = 0;
   resp.positionTicket = 0;
   resp.executedPrice = 0.0;
   resp.slippagePoints = 0.0;
   resp.brokerComment = "";
   resp.retcode = 0;

   // Guard: Duplicate prevention
   if(IsDuplicateOrderPending(req.symbol, req.strategyId))
   {
      resp.brokerComment = "SKIPPED: Duplicate order or active strategy position already exists.";
      return resp;
   }

   // Configure execution parameters
   m_trade.SetDeviationInPoints(req.maxSlippagePoints > 0 ? req.maxSlippagePoints : 10);
   m_trade.SetTypeFilling(GetOptimalFilling(req.symbol));

   // Tag metadata in comment: e.g. "Apex:S1:BullTrend"
   string orderComment = StringFormat("Apex:S%d:%s", req.strategyId, req.regimeTag);
   if(StringLen(orderComment) > 31) orderComment = StringSubstr(orderComment, 0, 31);

   bool sendSuccess = false;
   int attempt = 0;

   while(attempt < m_maxRetryAttempts && !sendSuccess)
   {
      attempt++;
      
      // Refresh real-time tick price
      MqlTick tick;
      if(!SymbolInfoTick(req.symbol, tick))
      {
         resp.brokerComment = "Failed to fetch live symbol tick before order transmission.";
         Sleep(100);
         continue;
      }

      double currentExecPrice = (req.orderType == ORDER_TYPE_BUY) ? tick.ask : tick.bid;

      if(req.orderType == ORDER_TYPE_BUY)
      {
         sendSuccess = m_trade.Buy(req.volume, req.symbol, currentExecPrice, req.stopLoss, req.takeProfit, orderComment);
      }
      else if(req.orderType == ORDER_TYPE_SELL)
      {
         sendSuccess = m_trade.Sell(req.volume, req.symbol, currentExecPrice, req.stopLoss, req.takeProfit, orderComment);
      }

      resp.retcode = m_trade.ResultRetcode();
      resp.brokerComment = m_trade.ResultComment();

      if(sendSuccess || resp.retcode == TRADE_RETCODE_DONE || resp.retcode == TRADE_RETCODE_PLACED)
      {
         resp.success = true;
         resp.orderTicket = m_trade.ResultOrder();
         resp.executedPrice = m_trade.ResultPrice();
         resp.positionTicket = m_trade.ResultDeal(); // deal ticket or position ticket

         double point = SymbolInfoDouble(req.symbol, SYMBOL_POINT);
         if(point > 0.0 && currentExecPrice > 0.0)
         {
            resp.slippagePoints = MathAbs(resp.executedPrice - currentExecPrice) / point;
         }

         m_lastOrderTime = TimeCurrent();

         PrintFormat("[EXECUTION SUCCESS] %s %s %.2f lots @ %.5f (SL: %.5f, TP: %.5f). Slippage: %.1f pts. Ticket #%I64u",
                     EnumToString(req.orderType), req.symbol, req.volume, resp.executedPrice, 
                     req.stopLoss, req.takeProfit, resp.slippagePoints, resp.orderTicket);
         break;
      }
      else
      {
         PrintFormat("[EXECUTION ATTEMPT %d FAILED] Retcode: %u (%s). Symbol: %s", 
                     attempt, resp.retcode, resp.brokerComment, req.symbol);

         // Handle requotes or transient network hiccups
         if(resp.retcode == TRADE_RETCODE_REQUOTE || resp.retcode == TRADE_RETCODE_PRICE_OFF)
         {
            Sleep(150 * attempt); // Exponential backoff
         }
         else
         {
            // Fatal broker rejection (e.g. invalid stops, market closed, not enough money)
            break;
         }
      }
   }

   return resp;
}

//+------------------------------------------------------------------+
//| Close Position Safely                                            |
//+------------------------------------------------------------------+
bool CTradeExecution::ClosePosition(ulong ticket, string reason)
{
   if(!m_trade.PositionClose(ticket))
   {
      PrintFormat("[EXECUTION ERROR] Failed to close position #%I64u (%s). Code: %u", 
                  ticket, reason, m_trade.ResultRetcode());
      return false;
   }
   PrintFormat("[EXECUTION] Position #%I64u closed successfully (%s).", ticket, reason);
   return true;
}

//+------------------------------------------------------------------+
//| Emergency Close All Positions Managed by this EA                 |
//+------------------------------------------------------------------+
bool CTradeExecution::CloseAllPositions(string reason)
{
   PrintFormat("[EMERGENCY EXECUTION] Initiating safe liquidation of all EA positions: %s", reason);
   bool allClosed = true;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0) continue;
      if(PositionGetInteger(POSITION_MAGIC) == (long)m_magicNumber)
      {
         if(!m_trade.PositionClose(ticket))
         {
            allClosed = false;
         }
      }
   }
   return allClosed;
}
