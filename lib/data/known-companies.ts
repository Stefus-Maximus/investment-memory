// A small hand-picked list to search against for §15 ("Bedrijf toevoegen").
// No external API/keys yet — swap this for a real symbol-search provider later.
export interface KnownCompany {
  name: string
  ticker: string
  exchange: string
}

export const KNOWN_COMPANIES: KnownCompany[] = [
  { name: 'ASML Holding', ticker: 'ASML', exchange: 'Euronext Amsterdam' },
  { name: 'Adyen', ticker: 'ADYEN', exchange: 'Euronext Amsterdam' },
  { name: 'Heineken', ticker: 'HEIA', exchange: 'Euronext Amsterdam' },
  { name: 'ING Groep', ticker: 'INGA', exchange: 'Euronext Amsterdam' },
  { name: 'Shell', ticker: 'SHELL', exchange: 'Euronext Amsterdam' },
  { name: 'Shell', ticker: 'SHEL', exchange: 'London Stock Exchange' },
  { name: 'Philips', ticker: 'PHIA', exchange: 'Euronext Amsterdam' },
  { name: 'Unilever', ticker: 'UNA', exchange: 'Euronext Amsterdam' },
  { name: 'Prosus', ticker: 'PRX', exchange: 'Euronext Amsterdam' },
  { name: 'Ahold Delhaize', ticker: 'AD', exchange: 'Euronext Amsterdam' },
  { name: 'KPN', ticker: 'KPN', exchange: 'Euronext Amsterdam' },
  { name: 'Wolters Kluwer', ticker: 'WKL', exchange: 'Euronext Amsterdam' },
  { name: 'Randstad', ticker: 'RAND', exchange: 'Euronext Amsterdam' },
  { name: 'ASM International', ticker: 'ASM', exchange: 'Euronext Amsterdam' },
  { name: 'NN Group', ticker: 'NN', exchange: 'Euronext Amsterdam' },
  { name: 'DSM-Firmenich', ticker: 'DSFIR', exchange: 'Euronext Amsterdam' },
  { name: 'IMCD', ticker: 'IMCD', exchange: 'Euronext Amsterdam' },
  { name: 'Apple', ticker: 'AAPL', exchange: 'NASDAQ' },
  { name: 'Microsoft', ticker: 'MSFT', exchange: 'NASDAQ' },
  { name: 'Alphabet', ticker: 'GOOGL', exchange: 'NASDAQ' },
  { name: 'Amazon', ticker: 'AMZN', exchange: 'NASDAQ' },
  { name: 'Meta Platforms', ticker: 'META', exchange: 'NASDAQ' },
  { name: 'Nvidia', ticker: 'NVDA', exchange: 'NASDAQ' },
  { name: 'Tesla', ticker: 'TSLA', exchange: 'NASDAQ' },
  { name: 'Netflix', ticker: 'NFLX', exchange: 'NASDAQ' },
  { name: 'Visa', ticker: 'V', exchange: 'NYSE' },
  { name: 'Mastercard', ticker: 'MA', exchange: 'NYSE' },
  { name: 'JPMorgan Chase', ticker: 'JPM', exchange: 'NYSE' },
  { name: 'Berkshire Hathaway', ticker: 'BRK.B', exchange: 'NYSE' },
  { name: 'Coca-Cola', ticker: 'KO', exchange: 'NYSE' },
  { name: 'Nike', ticker: 'NKE', exchange: 'NYSE' },
  { name: 'LVMH', ticker: 'MC', exchange: 'Euronext Paris' },
  { name: "L'Oréal", ticker: 'OR', exchange: 'Euronext Paris' },
  { name: 'TotalEnergies', ticker: 'TTE', exchange: 'Euronext Paris' },
  { name: 'Sanofi', ticker: 'SAN', exchange: 'Euronext Paris' },
  { name: 'SAP', ticker: 'SAP', exchange: 'XETRA' },
  { name: 'Siemens', ticker: 'SIE', exchange: 'XETRA' },
  { name: 'Volkswagen', ticker: 'VOW3', exchange: 'XETRA' },
  { name: 'BMW', ticker: 'BMW', exchange: 'XETRA' },
  { name: 'Adidas', ticker: 'ADS', exchange: 'XETRA' },
]

export function searchKnownCompanies(query: string): KnownCompany[] {
  const q = query.trim().toLowerCase()
  if (!q) return KNOWN_COMPANIES

  return KNOWN_COMPANIES.filter(
    (company) =>
      company.name.toLowerCase().includes(q) || company.ticker.toLowerCase().includes(q)
  )
}
