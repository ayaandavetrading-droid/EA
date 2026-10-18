//+------------------------------------------------------------------+
//|                                                  AuditLogger.mqh |
//|                                     Apex AI Trader Audit Logging |
//|               Structured Trade Journal & Decision Traceability   |
//+------------------------------------------------------------------+
#property copyright "Apex AI Quantitative Team"
#property link      "https://apexaitrader.internal"
#property strict

class CAuditLogger
{
private:
   string   m_filename;
   int      m_fileHandle;

public:
   CAuditLogger();
   ~CAuditLogger();

   void     Init(string prefix = "Apex_Audit_Log");
   void     LogDecision(const string symbol, 
                        const string eventType, 
                        const string strategyName, 
                        const string regimeName, 
                        const double volume, 
                        const double price, 
                        const double sl, 
                        const double tp, 
                        const string outcomeOrReason, 
                        const double pnl = 0.0);

   void     Close();
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CAuditLogger::CAuditLogger()
{
   m_fileHandle = INVALID_HANDLE;
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CAuditLogger::~CAuditLogger()
{
   Close();
}

//+------------------------------------------------------------------+
//| Initialize CSV File in MT5 Files Directory                       |
//+------------------------------------------------------------------+
void CAuditLogger::Init(string prefix)
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   m_filename = StringFormat("%s_%04d%02d%02d.csv", prefix, dt.year, dt.mon, dt.day);

   m_fileHandle = FileOpen(m_filename, FILE_WRITE|FILE_READ|FILE_CSV|FILE_COMMON, ',');
   if(m_fileHandle != INVALID_HANDLE)
   {
      // If new file, write CSV header
      if(FileSize(m_fileHandle) == 0)
      {
         FileWrite(m_fileHandle, 
                   "Timestamp", 
                   "Symbol", 
                   "Event", 
                   "Strategy", 
                   "Regime", 
                   "Volume", 
                   "Price", 
                   "StopLoss", 
                   "TakeProfit", 
                   "PnL", 
                   "Details_Or_Rejection");
      }
      FileSeek(m_fileHandle, 0, SEEK_END);
   }
}

//+------------------------------------------------------------------+
//| Log Decision                                                     |
//+------------------------------------------------------------------+
void CAuditLogger::LogDecision(const string symbol, 
                               const string eventType, 
                               const string strategyName, 
                               const string regimeName, 
                               const double volume, 
                               const double price, 
                               const double sl, 
                               const double tp, 
                               const string outcomeOrReason, 
                               const double pnl)
{
   string timestamp = TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);

   // 1. Output human-like disciplined rationale to MT5 Expert Log
   PrintFormat("[APEX AUDIT] %s | %s | %s | %s | Strat: %s | Lots: %.2f | Px: %.5f | SL: %.5f | Reason: %s",
               timestamp, eventType, symbol, regimeName, strategyName, volume, price, sl, outcomeOrReason);

   // 2. Write to persistent CSV file
   if(m_fileHandle != INVALID_HANDLE)
   {
      FileWrite(m_fileHandle, 
                timestamp, 
                symbol, 
                eventType, 
                strategyName, 
                regimeName, 
                DoubleToString(volume, 2), 
                DoubleToString(price, 5), 
                DoubleToString(sl, 5), 
                DoubleToString(tp, 5), 
                DoubleToString(pnl, 2), 
                outcomeOrReason);
      FileFlush(m_fileHandle);
   }
}

//+------------------------------------------------------------------+
//| Close File Handle                                                |
//+------------------------------------------------------------------+
void CAuditLogger::Close()
{
   if(m_fileHandle != INVALID_HANDLE)
   {
      FileClose(m_fileHandle);
      m_fileHandle = INVALID_HANDLE;
   }
}
