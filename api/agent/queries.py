"""Tavily query strings per specialist / discovery phase."""


def narrow_query(ticker: str, key: str) -> str:
    t = ticker.upper()
    if key == "fundamentals":
        return f'{t} NGX "Nigerian Stock Exchange" listed company annual report interim results IFRS audited "facts behind the figures" revenue profit EPS EBITDA dividend market cap share price naira volume doclib'
    if key == "news":
        return f'{t} NGX Nigeria stock dividend AGM bonus split rights issue results announcement corporate action Notices Circular'
    if key == "sentiment":
        return f'{t} NGX Nigeria stock analyst equity research "price target" buy hold sell consensus'
    return f"{t} NGX Nigeria"


def wide_query(ticker: str, key: str) -> str:
    t = ticker.upper()
    ngx = '(NGX OR "Nigerian Exchange" OR "NSE Nigeria" OR "Lagos" OR ngxgroup.com OR "quoted company Nigeria" OR naira)'
    if key == "fundamentals":
        return f'"{t}" {ngx} (financial statements OR "P/E" OR "P/B" OR ROE OR dividend yield OR "shares in issue" OR "market cap" OR "share price" OR "volume" OR "free float" OR "closing bid")'
    if key == "news":
        return f'"{t}" {ngx} (M&A OR acquisition OR "board changes" OR CEO OR dividend OR "AGM" OR "EGM" OR 2024 OR 2025 OR 2026) stock news corporate'
    if key == "sentiment":
        return f'"{t}" {ngx} (stock OR equity OR shares) (analyst OR consensus OR "research note" OR rating OR outlook) Nigeria'
    return f'"{t}" {ngx}'


def filings_exchange_query(ticker: str) -> str:
    t = ticker.upper()
    return f'{t} ("annual report" OR "interim results" OR "unaudited results" OR "audited financial" OR "full year" OR IFRS) (revenue OR "profit after tax" OR EPS OR "total assets" OR "shareholders\' funds" OR "market capitalisation" OR naira) NGX "Nigerian Exchange" financial statements 2023 2024 2025'


def market_data_query(ticker: str) -> str:
    t = ticker.upper()
    return f'"{t}" (NGX OR "Nigerian Exchange" OR "Lagos" OR "NSE:" OR naira) share price "market capitalisation" OR "market cap" "volume traded" "closing price" OR "last done" OR "YTD" equity'


def sentiment_deep_query(ticker: str) -> str:
    t = ticker.upper()
    return f'"{t}" (Nigeria OR NGX OR "Lagos bourse" OR naira) ("equity research" OR "initiating coverage" OR "price target" OR "Earnings" OR "FY" OR "Q1" OR "Q2" OR "Q3" OR "Q4" OR "Buy" OR "Hold" OR "Sell" OR "Overweight" OR "Underweight") (analyst OR broker OR research)'


def macro_query(ticker: str) -> str:
    t = ticker.upper()
    return f"Nigeria CBN monetary policy rate MPR headline inflation naira exchange rate NGX All Share Index Nigerian capital market listed equities context for ticker {t}"
