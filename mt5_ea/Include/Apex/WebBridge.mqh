//+------------------------------------------------------------------+
//|                                                    WebBridge.mqh |
//|                                      Apex AI Trader Remote Bridge|
//|               Bi-directional REST API Telemetry & Remote Control |
//+------------------------------------------------------------------+
#property copyright "Apex AI Quantitative Team"
#property link      "https://apexaitrader.internal"
#property strict

#include "RiskManager.mqh"

struct S_BridgeCommand
{
   bool   hasCommand;
   bool   emergencyStopRequested;
   bool   pauseTradingRequested;
   bool   resumeTradingRequested;
   double updateRiskPerTradePct;
};

class CWebBridge
{
private:
   string   m_serverUrl;
   string   m_apiKey;
   bool     m_isEnabled;
   datetime m_lastSyncTime;
   int      m_syncIntervalSec;

public:
   CWebBridge();
   ~CWebBridge();

   void     Init(string serverUrl = "http://127.0.0.1:3000/api/mt5", string apiKey = "apex_secret_token_123", int syncIntervalSec = 3);
   bool     SendHeartbeatAndTelemetry(const CRiskManager &riskMgr, S_BridgeCommand &outCmd);

private:
   string   BuildTelemetryJson(const CRiskManager &riskMgr);
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CWebBridge::CWebBridge()
{
   m_isEnabled = true;
   m_lastSyncTime = 0;
   m_syncIntervalSec = 3;
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CWebBridge::~CWebBridge()
{
}

//+------------------------------------------------------------------+
//| Initialize Bridge                                                |
//+------------------------------------------------------------------+
void CWebBridge::Init(string serverUrl, string apiKey, int syncIntervalSec)
{
   m_serverUrl = serverUrl;
   m_apiKey = apiKey;
   m_syncIntervalSec = syncIntervalSec;
   m_lastSyncTime = 0;
}

//+------------------------------------------------------------------+
//| Format JSON Payload                                              |
//+------------------------------------------------------------------+
string CWebBridge::BuildTelemetryJson(const CRiskManager &riskMgr)
{
   string json = "{";
   json += StringFormat("\"accountNumber\":%I64u,", AccountInfoInteger(ACCOUNT_LOGIN));
   json += StringFormat("\"balance\":%.2f,", AccountInfoDouble(ACCOUNT_BALANCE));
   json += StringFormat("\"equity\":%.2f,", AccountInfoDouble(ACCOUNT_EQUITY));
   json += StringFormat("\"freeMargin\":%.2f,", AccountInfoDouble(ACCOUNT_MARGIN_FREE));
   json += StringFormat("\"marginLevel\":%.2f,", AccountInfoDouble(ACCOUNT_MARGIN_LEVEL));
   json += StringFormat("\"dailyPnLPct\":%.2f,", riskMgr.GetDailyPnLPct());
   json += StringFormat("\"currentDrawdownPct\":%.2f,", riskMgr.GetCurrentDrawdownPct());
   json += StringFormat("\"openPositionsCount\":%d,", PositionsTotal());
   json += StringFormat("\"consecutiveLosses\":%d,", riskMgr.GetConsecutiveLosses());
   json += StringFormat("\"circuitBreaker\":%s,", riskMgr.IsCircuitBreakerTripped() ? "true" : "false");
   json += StringFormat("\"cooldownActive\":%s", riskMgr.IsCooldownActive() ? "true" : "false");
   json += "}";
   return json;
}

//+------------------------------------------------------------------+
//| Send Heartbeat via WebRequest (or fallback gracefully)           |
//+------------------------------------------------------------------+
bool CWebBridge::SendHeartbeatAndTelemetry(const CRiskManager &riskMgr, S_BridgeCommand &outCmd)
{
   outCmd.hasCommand = false;
   outCmd.emergencyStopRequested = false;
   outCmd.pauseTradingRequested = false;
   outCmd.resumeTradingRequested = false;
   outCmd.updateRiskPerTradePct = 0.0;

   if(!m_isEnabled) return false;
   if(TimeCurrent() - m_lastSyncTime < m_syncIntervalSec) return false;

   m_lastSyncTime = TimeCurrent();

   string endpoint = m_serverUrl + "/telemetry";
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + m_apiKey + "\r\n";
   string postData = BuildTelemetryJson(riskMgr);
   char postDataArr[];
   char resultArr[];
   string resultHeaders;

   StringToCharArray(postData, postDataArr, 0, WHOLE_ARRAY, CP_UTF8);

   int res = WebRequest("POST", endpoint, headers, 1500, postDataArr, resultArr, resultHeaders);
   if(res == 200)
   {
      string responseStr = CharArrayToString(resultArr, 0, WHOLE_ARRAY, CP_UTF8);
      
      // Parse remote emergency stop or pause flags if received
      if(StringFind(responseStr, "\"emergencyStop\":true") >= 0)
      {
         outCmd.hasCommand = true;
         outCmd.emergencyStopRequested = true;
      }
      if(StringFind(responseStr, "\"pauseTrading\":true") >= 0)
      {
         outCmd.hasCommand = true;
         outCmd.pauseTradingRequested = true;
      }
      if(StringFind(responseStr, "\"resumeTrading\":true") >= 0)
      {
         outCmd.hasCommand = true;
         outCmd.resumeTradingRequested = true;
      }

      return true;
   }
   else
   {
      // If WebRequest fails (e.g. URL not allowed in MT5 Options > Expert Advisors),
      // we log once and continue operating under 100% autonomous local safety rules!
      return false;
   }
}
