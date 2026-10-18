//+------------------------------------------------------------------+
//|                                        GoldSymbolDiscovery.mqh   |
//|                          Apex Gold AI — XAUUSD Discovery Engine  |
//|           Strict Broker Gold Mapping & Contract Spec Verification|
//+------------------------------------------------------------------+
#property copyright "Apex Gold AI Quantitative Team"
#property link      "https://apexgold.internal"
#property strict

struct S_GoldContractSpec
{
   string   symbol;                   // Confirmed broker symbol name (e.g. XAUUSD, GOLD, XAUUSD.a)
   string   description;              // e.g. "Gold vs US Dollar (Spot)"
   string   baseCurrency;             // "XAU"
   string   profitCurrency;           // "USD"
   double   contractSize;             // Standard: 100 oz (or mini 10 oz)
   double   tickSize;                 // e.g. 0.01
   double   tickValue;                // Monetary value of 1 tick on 1.0 lot in account currency
   double   minVolume;                // Broker minimum lot (0.01 or 0.05)
   double   maxVolume;                // Broker maximum lot (e.g. 50.0)
   double   volumeStep;               // Broker volume precision step (e.g. 0.01)
   int      stopsLevel;               // Minimum stop-loss distance in points
   int      digits;                   // 2 or 3 digits (e.g. 2724.50 vs 2724.500)
   double   point;                    // Symbol point size
   bool     isTradeable;              // Symbol trading permitted
   bool     isVerifiedGold;           // Strictly confirmed as gold
   string   verificationNotes;
};

class CGoldSymbolDiscovery
{
private:
   S_GoldContractSpec m_spec;

public:
   CGoldSymbolDiscovery();
   ~CGoldSymbolDiscovery();

   bool                       DiscoverAndVerifyGold(string overrideSymbol = "");
   const S_GoldContractSpec*  GetContractSpec() const { return &m_spec; }
   string                     GetConfirmedSymbol() const { return m_spec.symbol; }
   bool                       IsGoldSymbol(const string sym) const;
   bool                       IsVerified() const { return m_spec.isVerifiedGold; }
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CGoldSymbolDiscovery::CGoldSymbolDiscovery()
{
   ZeroMemory(m_spec);
   m_spec.isVerifiedGold = false;
}

CGoldSymbolDiscovery::~CGoldSymbolDiscovery()
{
}

//+------------------------------------------------------------------+
//| Auto-Discover and Verify Broker's Exact Gold Symbol              |
//+------------------------------------------------------------------+
bool CGoldSymbolDiscovery::DiscoverAndVerifyGold(string overrideSymbol)
{
   ZeroMemory(m_spec);
   m_spec.isVerifiedGold = false;

   // Common broker gold symbol representations
   string candidateSymbols[] = {
      "XAUUSD", "GOLD", "XAUUSDm", "XAUUSD.a", "XAUUSD.ecn", 
      "XAUUSD_i", "XAUUSD.raw", "XAUUSDe", "XAUUSD.pro", "XAUUSD+"
   };

   string selectedSymbol = "";

   // 1. If override provided, test it first
   if(StringLen(overrideSymbol) > 0)
   {
      if(SymbolSelect(overrideSymbol, true))
      {
         selectedSymbol = overrideSymbol;
      }
   }

   // 2. Otherwise scan candidate list
   if(StringLen(selectedSymbol) == 0)
   {
      for(int i = 0; i < ArraySize(candidateSymbols); i++)
      {
         if(SymbolSelect(candidateSymbols[i], true))
         {
            selectedSymbol = candidateSymbols[i];
            break;
         }
      }
   }

   // 3. Fallback: Scan Market Watch for any symbol with XAU base or Gold description
   if(StringLen(selectedSymbol) == 0)
   {
      int totalSymbols = SymbolsTotal(false);
      for(int i = 0; i < totalSymbols; i++)
      {
         string sym = SymbolName(i, false);
         string base = SymbolInfoString(sym, SYMBOL_CURRENCY_BASE);
         string desc = SymbolInfoString(sym, SYMBOL_DESCRIPTION);
         StringToUpper(base);
         StringToUpper(desc);

         if(base == "XAU" || StringFind(desc, "GOLD") >= 0 || StringFind(desc, "XAUUSD") >= 0)
         {
            SymbolSelect(sym, true);
            selectedSymbol = sym;
            break;
         }
      }
   }

   if(StringLen(selectedSymbol) == 0)
   {
      m_spec.verificationNotes = "FATAL: Could not discover any supported XAUUSD/Gold symbol on connected broker.";
      PrintFormat("[GOLD DISCOVERY ERROR] %s", m_spec.verificationNotes);
      return false;
   }

   // 4. Verify specifications
   m_spec.symbol          = selectedSymbol;
   m_spec.description     = SymbolInfoString(selectedSymbol, SYMBOL_DESCRIPTION);
   m_spec.baseCurrency    = SymbolInfoString(selectedSymbol, SYMBOL_CURRENCY_BASE);
   m_spec.profitCurrency  = SymbolInfoString(selectedSymbol, SYMBOL_CURRENCY_PROFIT);
   m_spec.contractSize    = SymbolInfoDouble(selectedSymbol, SYMBOL_TRADE_CONTRACT_SIZE);
   m_spec.tickSize        = SymbolInfoDouble(selectedSymbol, SYMBOL_TRADE_TICK_SIZE);
   m_spec.tickValue       = SymbolInfoDouble(selectedSymbol, SYMBOL_TRADE_TICK_VALUE);
   m_spec.minVolume       = SymbolInfoDouble(selectedSymbol, SYMBOL_VOLUME_MIN);
   m_spec.maxVolume       = SymbolInfoDouble(selectedSymbol, SYMBOL_VOLUME_MAX);
   m_spec.volumeStep      = SymbolInfoDouble(selectedSymbol, SYMBOL_VOLUME_STEP);
   m_spec.stopsLevel      = (int)SymbolInfoInteger(selectedSymbol, SYMBOL_TRADE_STOPS_LEVEL);
   m_spec.digits          = (int)SymbolInfoInteger(selectedSymbol, SYMBOL_DIGITS);
   m_spec.point           = SymbolInfoDouble(selectedSymbol, SYMBOL_POINT);
   
   ENUM_SYMBOL_TRADE_MODE tradeMode = (ENUM_SYMBOL_TRADE_MODE)SymbolInfoInteger(selectedSymbol, SYMBOL_TRADE_MODE);
   m_spec.isTradeable     = (tradeMode == SYMBOL_TRADE_MODE_FULL);

   // Strict validation assertions
   bool baseIsGold = (m_spec.baseCurrency == "XAU" || StringFind(m_spec.description, "Gold") >= 0 || StringFind(m_spec.description, "GOLD") >= 0);
   bool contractValid = (m_spec.contractSize >= 1.0 && m_spec.tickSize > 0.0 && m_spec.tickValue > 0.0);

   if(!baseIsGold)
   {
      m_spec.verificationNotes = StringFormat("REJECTED: Discovered symbol '%s' does not represent verified physical Gold (Base: %s).", selectedSymbol, m_spec.baseCurrency);
      PrintFormat("[GOLD DISCOVERY] %s", m_spec.verificationNotes);
      return false;
   }

   if(!contractValid)
   {
      m_spec.verificationNotes = StringFormat("REJECTED: Gold symbol '%s' has invalid contract specs (Contract: %.1f, TickSize: %.5f, TickVal: %.2f).", 
                                              selectedSymbol, m_spec.contractSize, m_spec.tickSize, m_spec.tickValue);
      PrintFormat("[GOLD DISCOVERY] %s", m_spec.verificationNotes);
      return false;
   }

   if(!m_spec.isTradeable)
   {
      m_spec.verificationNotes = StringFormat("WARNING: Gold symbol '%s' trading is currently restricted or halted by broker.", selectedSymbol);
      PrintFormat("[GOLD DISCOVERY] %s", m_spec.verificationNotes);
      return false;
   }

   m_spec.isVerifiedGold = true;
   m_spec.verificationNotes = StringFormat("VERIFIED: Successfully mapped gold symbol '%s' (Contract: %.0f oz, TickVal: $%.2f, MinLot: %.2f)", 
                                           selectedSymbol, m_spec.contractSize, m_spec.tickValue, m_spec.minVolume);
   PrintFormat("====================================================================");
   PrintFormat("[APEX GOLD DISCOVERY] %s", m_spec.verificationNotes);
   PrintFormat("Broker: %s | Server: %s | Account: %I64u", 
               AccountInfoString(ACCOUNT_COMPANY), AccountInfoString(ACCOUNT_SERVER), AccountInfoInteger(ACCOUNT_LOGIN));
   PrintFormat("====================================================================");

   return true;
}

//+------------------------------------------------------------------+
//| Hard Check: Ensure symbol is the verified Gold instrument        |
//+------------------------------------------------------------------+
bool CGoldSymbolDiscovery::IsGoldSymbol(const string sym) const
{
   if(!m_spec.isVerifiedGold) return false;
   return (sym == m_spec.symbol);
}
