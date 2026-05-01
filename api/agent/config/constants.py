"""Static domain lists and API URLs for the research agent."""

TAVILY_SEARCH_URL = "https://api.tavily.com/search"
OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

SPECIALIST_KEYS = ["fundamentals", "news", "macro", "sentiment"]
MAX_DISCOVERY_ENRICHMENT_TICKERS = 5

NGX_PRIORITY_DOMAINS = [
    "ngxgroup.com",
    "nairametrics.com",
    "proshare.ng",
    "proshare.com",
    "businessday.ng",
    "businesspost.ng",
    "thecable.ng",
    "punchng.com",
    "guardian.ng",
    "vanguardngr.com",
    "thisdaylive.com",
    "premiumtimesng.com",
    "investdata.com.ng",
    "cbn.gov.ng",
    "nipc.gov.ng",
    "fmdqgroup.com",
    "sec.gov.ng",
]

NGX_EXCHANGE_DOMAINS = ["ngxgroup.com", "fmdqgroup.com"]

GLOBAL_TICKER_NOISE_DOMAINS = [
    "investing.com",
    "finance.yahoo.com",
    "yahoo.com",
    "marketwatch.com",
    "msn.com",
    "seekingalpha.com",
    "morningstar.com",
    "stockanalysis.com",
]
