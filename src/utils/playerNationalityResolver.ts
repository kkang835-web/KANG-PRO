/**
 * Comprehensive Soccer Player & National Flag Code Resolver
 *
 * Systematically matches player names (Korean, English, abbreviated, or compound)
 * to their verified country code and country name, avoiding incorrect fallbacks.
 */

export interface PlayerNationality {
  countryCode: string; // ISO 3166-1 alpha-2 (or gb-eng, gb-sct, gb-wls, gb-nir)
  countryName: string;
}

// -----------------------------------------------------------------------------
// Standard Country Code Mappings (Normalizing 3-letter, uppercase, and Korean names)
// -----------------------------------------------------------------------------
// Standard Country Code Mappings (Normalizing 3-letter, uppercase, and Korean names)
// -----------------------------------------------------------------------------
export const COUNTRY_CODE_MAP: Record<string, { code: string; name: string }> = {
  // UK & British Isles
  'EN': { code: 'gb-eng', name: 'England' },
  'ENG': { code: 'gb-eng', name: 'England' },
  'ENGLAND': { code: 'gb-eng', name: 'England' },
  'GB-ENG': { code: 'gb-eng', name: 'England' },
  '잉글랜드': { code: 'gb-eng', name: 'England' },
  'SCT': { code: 'gb-sct', name: 'Scotland' },
  'SCO': { code: 'gb-sct', name: 'Scotland' },
  'SCOTLAND': { code: 'gb-sct', name: 'Scotland' },
  'GB-SCT': { code: 'gb-sct', name: 'Scotland' },
  '스코틀랜드': { code: 'gb-sct', name: 'Scotland' },
  'WAL': { code: 'gb-wls', name: 'Wales' },
  'WLS': { code: 'gb-wls', name: 'Wales' },
  'WALES': { code: 'gb-wls', name: 'Wales' },
  'GB-WLS': { code: 'gb-wls', name: 'Wales' },
  '웨일스': { code: 'gb-wls', name: 'Wales' },
  'NIR': { code: 'gb-nir', name: 'Northern Ireland' },
  'GB-NIR': { code: 'gb-nir', name: 'Northern Ireland' },
  '북아일랜드': { code: 'gb-nir', name: 'Northern Ireland' },
  'IE': { code: 'ie', name: 'Ireland' },
  'IRL': { code: 'ie', name: 'Ireland' },
  'IRELAND': { code: 'ie', name: 'Ireland' },
  '아일랜드': { code: 'ie', name: 'Ireland' },

  // East Asia & Southeast Asia
  'KR': { code: 'kr', name: 'South Korea' },
  'KOR': { code: 'kr', name: 'South Korea' },
  'SOUTH KOREA': { code: 'kr', name: 'South Korea' },
  'KOREA, REPUBLIC OF': { code: 'kr', name: 'South Korea' },
  '대한민국': { code: 'kr', name: 'South Korea' },
  '한국': { code: 'kr', name: 'South Korea' },
  'KP': { code: 'kp', name: 'North Korea' },
  'PRK': { code: 'kp', name: 'North Korea' },
  'NORTH KOREA': { code: 'kp', name: 'North Korea' },
  'DPR KOREA': { code: 'kp', name: 'North Korea' },
  '북한': { code: 'kp', name: 'North Korea' },
  '조선': { code: 'kp', name: 'North Korea' },
  'JP': { code: 'jp', name: 'Japan' },
  'JPN': { code: 'jp', name: 'Japan' },
  'JAPAN': { code: 'jp', name: 'Japan' },
  '일본': { code: 'jp', name: 'Japan' },
  'CN': { code: 'cn', name: 'China' },
  'CHN': { code: 'cn', name: 'China' },
  'CHINA': { code: 'cn', name: 'China' },
  '중국': { code: 'cn', name: 'China' },
  'MN': { code: 'mn', name: 'Mongolia' },
  'MNG': { code: 'mn', name: 'Mongolia' },
  'MONGOLIA': { code: 'mn', name: 'Mongolia' },
  '몽골': { code: 'mn', name: 'Mongolia' },
  'TW': { code: 'tw', name: 'Taiwan' },
  'TWN': { code: 'tw', name: 'Taiwan' },
  'TAIWAN': { code: 'tw', name: 'Taiwan' },
  'CHINESE TAIPEI': { code: 'tw', name: 'Taiwan' },
  '대만': { code: 'tw', name: 'Taiwan' },
  '타이완': { code: 'tw', name: 'Taiwan' },
  '차이니즈타이베이': { code: 'tw', name: 'Taiwan' },
  '중화타이베이': { code: 'tw', name: 'Taiwan' },
  'HK': { code: 'hk', name: 'Hong Kong' },
  'HKG': { code: 'hk', name: 'Hong Kong' },
  'HONG KONG': { code: 'hk', name: 'Hong Kong' },
  '홍콩': { code: 'hk', name: 'Hong Kong' },
  'MO': { code: 'mo', name: 'Macau' },
  'MAC': { code: 'mo', name: 'Macau' },
  'MACAU': { code: 'mo', name: 'Macau' },
  '마카오': { code: 'mo', name: 'Macau' },
  'VN': { code: 'vn', name: 'Vietnam' },
  'VNM': { code: 'vn', name: 'Vietnam' },
  'VIETNAM': { code: 'vn', name: 'Vietnam' },
  '베트남': { code: 'vn', name: 'Vietnam' },
  'TH': { code: 'th', name: 'Thailand' },
  'THA': { code: 'th', name: 'Thailand' },
  'THAILAND': { code: 'th', name: 'Thailand' },
  '태국': { code: 'th', name: 'Thailand' },
  'MY': { code: 'my', name: 'Malaysia' },
  'MYS': { code: 'my', name: 'Malaysia' },
  'MALAYSIA': { code: 'my', name: 'Malaysia' },
  '말레이시아': { code: 'my', name: 'Malaysia' },
  '말레이': { code: 'my', name: 'Malaysia' },
  'ID': { code: 'id', name: 'Indonesia' },
  'IDN': { code: 'id', name: 'Indonesia' },
  'INDONESIA': { code: 'id', name: 'Indonesia' },
  '인도네시아': { code: 'id', name: 'Indonesia' },
  '인도네': { code: 'id', name: 'Indonesia' },
  'SG': { code: 'sg', name: 'Singapore' },
  'SGP': { code: 'sg', name: 'Singapore' },
  'SINGAPORE': { code: 'sg', name: 'Singapore' },
  '싱가포르': { code: 'sg', name: 'Singapore' },
  '싱가포': { code: 'sg', name: 'Singapore' },
  'PH': { code: 'ph', name: 'Philippines' },
  'PHL': { code: 'ph', name: 'Philippines' },
  'PHILIPPINES': { code: 'ph', name: 'Philippines' },
  '필리핀': { code: 'ph', name: 'Philippines' },
  'MM': { code: 'mm', name: 'Myanmar' },
  'MMR': { code: 'mm', name: 'Myanmar' },
  'MYANMAR': { code: 'mm', name: 'Myanmar' },
  '미얀마': { code: 'mm', name: 'Myanmar' },
  '버마': { code: 'mm', name: 'Myanmar' },
  'KH': { code: 'kh', name: 'Cambodia' },
  'KHM': { code: 'kh', name: 'Cambodia' },
  'CAMBODIA': { code: 'kh', name: 'Cambodia' },
  '캄보디아': { code: 'kh', name: 'Cambodia' },
  '캄보디': { code: 'kh', name: 'Cambodia' },
  'LA': { code: 'la', name: 'Laos' },
  'LAO': { code: 'la', name: 'Laos' },
  'LAOS': { code: 'la', name: 'Laos' },
  '라오스': { code: 'la', name: 'Laos' },
  'BN': { code: 'bn', name: 'Brunei' },
  'BRN': { code: 'bn', name: 'Brunei' },
  'BRUNEI': { code: 'bn', name: 'Brunei' },
  '브루나이': { code: 'bn', name: 'Brunei' },
  '브루나': { code: 'bn', name: 'Brunei' },
  'TL': { code: 'tl', name: 'Timor-Leste' },
  'TLS': { code: 'tl', name: 'Timor-Leste' },
  'TIMOR-LESTE': { code: 'tl', name: 'Timor-Leste' },
  'EAST TIMOR': { code: 'tl', name: 'Timor-Leste' },
  '동티모르': { code: 'tl', name: 'Timor-Leste' },
  '티모르': { code: 'tl', name: 'Timor-Leste' },

  // Central Asia & South Asia
  'KZ': { code: 'kz', name: 'Kazakhstan' },
  'KAZ': { code: 'kz', name: 'Kazakhstan' },
  'KAZAKHSTAN': { code: 'kz', name: 'Kazakhstan' },
  '카자흐스탄': { code: 'kz', name: 'Kazakhstan' },
  '카자흐': { code: 'kz', name: 'Kazakhstan' },
  '카자흐스': { code: 'kz', name: 'Kazakhstan' },
  'KG': { code: 'kg', name: 'Kyrgyzstan' },
  'KGZ': { code: 'kg', name: 'Kyrgyzstan' },
  'KYRGYZSTAN': { code: 'kg', name: 'Kyrgyzstan' },
  '키르기스스탄': { code: 'kg', name: 'Kyrgyzstan' },
  '키르기스': { code: 'kg', name: 'Kyrgyzstan' },
  '키르기즈': { code: 'kg', name: 'Kyrgyzstan' },
  '키르기': { code: 'kg', name: 'Kyrgyzstan' },
  'TJ': { code: 'tj', name: 'Tajikistan' },
  'TJK': { code: 'tj', name: 'Tajikistan' },
  'TAJIKISTAN': { code: 'tj', name: 'Tajikistan' },
  '타지키스탄': { code: 'tj', name: 'Tajikistan' },
  '타지키': { code: 'tj', name: 'Tajikistan' },
  '타지크': { code: 'tj', name: 'Tajikistan' },
  'TM': { code: 'tm', name: 'Turkmenistan' },
  'TKM': { code: 'tm', name: 'Turkmenistan' },
  'TURKMENISTAN': { code: 'tm', name: 'Turkmenistan' },
  '투르크메니스탄': { code: 'tm', name: 'Turkmenistan' },
  '투르크메': { code: 'tm', name: 'Turkmenistan' },
  '투르크': { code: 'tm', name: 'Turkmenistan' },
  'UZ': { code: 'uz', name: 'Uzbekistan' },
  'UZB': { code: 'uz', name: 'Uzbekistan' },
  'UZBEKISTAN': { code: 'uz', name: 'Uzbekistan' },
  '우즈베키스탄': { code: 'uz', name: 'Uzbekistan' },
  '우즈벡': { code: 'uz', name: 'Uzbekistan' },
  '우즈베키': { code: 'uz', name: 'Uzbekistan' },
  'NP': { code: 'np', name: 'Nepal' },
  'NPL': { code: 'np', name: 'Nepal' },
  'NEPAL': { code: 'np', name: 'Nepal' },
  '네팔': { code: 'np', name: 'Nepal' },
  'IN': { code: 'in', name: 'India' },
  'IND': { code: 'in', name: 'India' },
  'INDIA': { code: 'in', name: 'India' },
  '인도': { code: 'in', name: 'India' },
  'PK': { code: 'pk', name: 'Pakistan' },
  'PAK': { code: 'pk', name: 'Pakistan' },
  'PAKISTAN': { code: 'pk', name: 'Pakistan' },
  '파키스탄': { code: 'pk', name: 'Pakistan' },
  'BD': { code: 'bd', name: 'Bangladesh' },
  'BGD': { code: 'bd', name: 'Bangladesh' },
  'BANGLADESH': { code: 'bd', name: 'Bangladesh' },
  '방글라데시': { code: 'bd', name: 'Bangladesh' },
  '방글라': { code: 'bd', name: 'Bangladesh' },
  'LK': { code: 'lk', name: 'Sri Lanka' },
  'LKA': { code: 'lk', name: 'Sri Lanka' },
  'SRI LANKA': { code: 'lk', name: 'Sri Lanka' },
  '스리랑카': { code: 'lk', name: 'Sri Lanka' },
  '스리랑': { code: 'lk', name: 'Sri Lanka' },
  'MV': { code: 'mv', name: 'Maldives' },
  'MDV': { code: 'mv', name: 'Maldives' },
  'MALDIVES': { code: 'mv', name: 'Maldives' },
  '몰디브': { code: 'mv', name: 'Maldives' },
  'BT': { code: 'bt', name: 'Bhutan' },
  'BTN': { code: 'bt', name: 'Bhutan' },
  'BHUTAN': { code: 'bt', name: 'Bhutan' },
  '부탄': { code: 'bt', name: 'Bhutan' },
  'AF': { code: 'af', name: 'Afghanistan' },
  'AFG': { code: 'af', name: 'Afghanistan' },
  'AFGHANISTAN': { code: 'af', name: 'Afghanistan' },
  '아프가니스탄': { code: 'af', name: 'Afghanistan' },
  '아프간': { code: 'af', name: 'Afghanistan' },

  // Middle East / West Asia
  'IR': { code: 'ir', name: 'Iran' },
  'IRN': { code: 'ir', name: 'Iran' },
  'IRAN': { code: 'ir', name: 'Iran' },
  '이란': { code: 'ir', name: 'Iran' },
  'IQ': { code: 'iq', name: 'Iraq' },
  'IRQ': { code: 'iq', name: 'Iraq' },
  'IRAQ': { code: 'iq', name: 'Iraq' },
  '이라크': { code: 'iq', name: 'Iraq' },
  'SA': { code: 'sa', name: 'Saudi Arabia' },
  'SAU': { code: 'sa', name: 'Saudi Arabia' },
  'SAUDI ARABIA': { code: 'sa', name: 'Saudi Arabia' },
  '사우디아라비아': { code: 'sa', name: 'Saudi Arabia' },
  '사우디': { code: 'sa', name: 'Saudi Arabia' },
  'QA': { code: 'qa', name: 'Qatar' },
  'QAT': { code: 'qa', name: 'Qatar' },
  'QATAR': { code: 'qa', name: 'Qatar' },
  '카타르': { code: 'qa', name: 'Qatar' },
  'AE': { code: 'ae', name: 'United Arab Emirates' },
  'ARE': { code: 'ae', name: 'United Arab Emirates' },
  'UNITED ARAB EMIRATES': { code: 'ae', name: 'United Arab Emirates' },
  'UAE': { code: 'ae', name: 'United Arab Emirates' },
  '아랍에미리트': { code: 'ae', name: 'United Arab Emirates' },
  '아랍에미': { code: 'ae', name: 'United Arab Emirates' },
  'JO': { code: 'jo', name: 'Jordan' },
  'JOR': { code: 'jo', name: 'Jordan' },
  'JORDAN': { code: 'jo', name: 'Jordan' },
  '요르단': { code: 'jo', name: 'Jordan' },
  'OM': { code: 'om', name: 'Oman' },
  'OMN': { code: 'om', name: 'Oman' },
  'OMAN': { code: 'om', name: 'Oman' },
  '오만': { code: 'om', name: 'Oman' },
  'BH': { code: 'bh', name: 'Bahrain' },
  'BHR': { code: 'bh', name: 'Bahrain' },
  'BAHRAIN': { code: 'bh', name: 'Bahrain' },
  '바레인': { code: 'bh', name: 'Bahrain' },
  'KW': { code: 'kw', name: 'Kuwait' },
  'KWT': { code: 'kw', name: 'Kuwait' },
  'KUWAIT': { code: 'kw', name: 'Kuwait' },
  '쿠웨이트': { code: 'kw', name: 'Kuwait' },
  'SY': { code: 'sy', name: 'Syria' },
  'SYR': { code: 'sy', name: 'Syria' },
  'SYRIA': { code: 'sy', name: 'Syria' },
  '시리아': { code: 'sy', name: 'Syria' },
  'LB': { code: 'lb', name: 'Lebanon' },
  'LBN': { code: 'lb', name: 'Lebanon' },
  'LEBANON': { code: 'lb', name: 'Lebanon' },
  '레바논': { code: 'lb', name: 'Lebanon' },
  'PS': { code: 'ps', name: 'Palestine' },
  'PSE': { code: 'ps', name: 'Palestine' },
  'PALESTINE': { code: 'ps', name: 'Palestine' },
  '팔레스타인': { code: 'ps', name: 'Palestine' },
  '팔레스타': { code: 'ps', name: 'Palestine' },
  'YE': { code: 'ye', name: 'Yemen' },
  'YEM': { code: 'ye', name: 'Yemen' },
  'YEMEN': { code: 'ye', name: 'Yemen' },
  '예멘': { code: 'ye', name: 'Yemen' },

  // Oceania
  'AU': { code: 'au', name: 'Australia' },
  'AUS': { code: 'au', name: 'Australia' },
  'AUSTRALIA': { code: 'au', name: 'Australia' },
  '호주': { code: 'au', name: 'Australia' },
  '오스트레일리아': { code: 'au', name: 'Australia' },
  'NZ': { code: 'nz', name: 'New Zealand' },
  'NZL': { code: 'nz', name: 'New Zealand' },
  'NEW ZEALAND': { code: 'nz', name: 'New Zealand' },
  '뉴질랜드': { code: 'nz', name: 'New Zealand' },
  '뉴질랜': { code: 'nz', name: 'New Zealand' },
  'GU': { code: 'gu', name: 'Guam' },
  'GUM': { code: 'gu', name: 'Guam' },
  'GUAM': { code: 'gu', name: 'Guam' },
  '괌': { code: 'gu', name: 'Guam' },

  // Africa
  'MA': { code: 'ma', name: 'Morocco' },
  'MAR': { code: 'ma', name: 'Morocco' },
  'MOROCCO': { code: 'ma', name: 'Morocco' },
  '모로코': { code: 'ma', name: 'Morocco' },
  'EG': { code: 'eg', name: 'Egypt' },
  'EGY': { code: 'eg', name: 'Egypt' },
  'EGYPT': { code: 'eg', name: 'Egypt' },
  '이집트': { code: 'eg', name: 'Egypt' },
  'SN': { code: 'sn', name: 'Senegal' },
  'SEN': { code: 'sn', name: 'Senegal' },
  'SENEGAL': { code: 'sn', name: 'Senegal' },
  '세네갈': { code: 'sn', name: 'Senegal' },
  'NG': { code: 'ng', name: 'Nigeria' },
  'NGA': { code: 'ng', name: 'Nigeria' },
  'NIGERIA': { code: 'ng', name: 'Nigeria' },
  '나이지리아': { code: 'ng', name: 'Nigeria' },
  'GH': { code: 'gh', name: 'Ghana' },
  'GHA': { code: 'gh', name: 'Ghana' },
  'GHANA': { code: 'gh', name: 'Ghana' },
  '가나': { code: 'gh', name: 'Ghana' },
  'CI': { code: 'ci', name: 'Ivory Coast' },
  'CIV': { code: 'ci', name: 'Ivory Coast' },
  'IVORY COAST': { code: 'ci', name: 'Ivory Coast' },
  '코트디부아르': { code: 'ci', name: 'Ivory Coast' },
  'CM': { code: 'cm', name: 'Cameroon' },
  'CMR': { code: 'cm', name: 'Cameroon' },
  'CAMEROON': { code: 'cm', name: 'Cameroon' },
  '카메룬': { code: 'cm', name: 'Cameroon' },
  'DZ': { code: 'dz', name: 'Algeria' },
  'DZA': { code: 'dz', name: 'Algeria' },
  'ALGERIA': { code: 'dz', name: 'Algeria' },
  '알제리': { code: 'dz', name: 'Algeria' },
  'ML': { code: 'ml', name: 'Mali' },
  'MLI': { code: 'ml', name: 'Mali' },
  'MALI': { code: 'ml', name: 'Mali' },
  '말리': { code: 'ml', name: 'Mali' },
  'CD': { code: 'cd', name: 'DR Congo' },
  'COD': { code: 'cd', name: 'DR Congo' },
  'DR CONGO': { code: 'cd', name: 'DR Congo' },
  '콩고': { code: 'cd', name: 'DR Congo' }
};

// -----------------------------------------------------------------------------
// Verified Player Registry (English & Korean Names to Exact Country)
// -----------------------------------------------------------------------------
export const PLAYER_NATIONALITY_REGISTRY: Record<string, PlayerNationality> = {
  // Real Madrid
  'mbappe': { countryCode: 'fr', countryName: 'France' },
  'mbappé': { countryCode: 'fr', countryName: 'France' },
  'k. mbappe': { countryCode: 'fr', countryName: 'France' },
  '음바페': { countryCode: 'fr', countryName: 'France' },
  '킬리안 음바페': { countryCode: 'fr', countryName: 'France' },
  'vinicius': { countryCode: 'br', countryName: 'Brazil' },
  'vinícius': { countryCode: 'br', countryName: 'Brazil' },
  'vinicius jr': { countryCode: 'br', countryName: 'Brazil' },
  '비니시우스': { countryCode: 'br', countryName: 'Brazil' },
  'bellingham': { countryCode: 'gb-eng', countryName: 'England' },
  'j. bellingham': { countryCode: 'gb-eng', countryName: 'England' },
  '벨링엄': { countryCode: 'gb-eng', countryName: 'England' },
  'valverde': { countryCode: 'uy', countryName: 'Uruguay' },
  'f. valverde': { countryCode: 'uy', countryName: 'Uruguay' },
  '발베르데': { countryCode: 'uy', countryName: 'Uruguay' },
  'tchouameni': { countryCode: 'fr', countryName: 'France' },
  'tchouaméni': { countryCode: 'fr', countryName: 'France' },
  '추아메니': { countryCode: 'fr', countryName: 'France' },
  'camavinga': { countryCode: 'fr', countryName: 'France' },
  '카마빙가': { countryCode: 'fr', countryName: 'France' },
  'modric': { countryCode: 'hr', countryName: 'Croatia' },
  'modrić': { countryCode: 'hr', countryName: 'Croatia' },
  '모드리치': { countryCode: 'hr', countryName: 'Croatia' },
  'guler': { countryCode: 'tr', countryName: 'Turkey' },
  'güler': { countryCode: 'tr', countryName: 'Turkey' },
  '귈러': { countryCode: 'tr', countryName: 'Turkey' },
  '아르다 귈러': { countryCode: 'tr', countryName: 'Turkey' },
  'rodrygo': { countryCode: 'br', countryName: 'Brazil' },
  '호드리구': { countryCode: 'br', countryName: 'Brazil' },
  'endrick': { countryCode: 'br', countryName: 'Brazil' },
  '엔드릭': { countryCode: 'br', countryName: 'Brazil' },
  'courtois': { countryCode: 'be', countryName: 'Belgium' },
  't. courtois': { countryCode: 'be', countryName: 'Belgium' },
  '쿠르투아': { countryCode: 'be', countryName: 'Belgium' },
  'rudiger': { countryCode: 'de', countryName: 'Germany' },
  'rüdiger': { countryCode: 'de', countryName: 'Germany' },
  '뤼디거': { countryCode: 'de', countryName: 'Germany' },
  'militao': { countryCode: 'br', countryName: 'Brazil' },
  'militão': { countryCode: 'br', countryName: 'Brazil' },
  '밀리탕': { countryCode: 'br', countryName: 'Brazil' },
  'carvajal': { countryCode: 'es', countryName: 'Spain' },
  '카르바할': { countryCode: 'es', countryName: 'Spain' },
  'mendy': { countryCode: 'fr', countryName: 'France' },
  '멘디': { countryCode: 'fr', countryName: 'France' },

  // Barcelona
  'yamal': { countryCode: 'es', countryName: 'Spain' },
  'l. yamal': { countryCode: 'es', countryName: 'Spain' },
  '야말': { countryCode: 'es', countryName: 'Spain' },
  '라민 야말': { countryCode: 'es', countryName: 'Spain' },
  'lewandowski': { countryCode: 'pl', countryName: 'Poland' },
  'r. lewandowski': { countryCode: 'pl', countryName: 'Poland' },
  '레반도프스키': { countryCode: 'pl', countryName: 'Poland' },
  'raphinha': { countryCode: 'br', countryName: 'Brazil' },
  '하피냐': { countryCode: 'br', countryName: 'Brazil' },
  'pedri': { countryCode: 'es', countryName: 'Spain' },
  '페드리': { countryCode: 'es', countryName: 'Spain' },
  'gavi': { countryCode: 'es', countryName: 'Spain' },
  '가비': { countryCode: 'es', countryName: 'Spain' },
  'olmo': { countryCode: 'es', countryName: 'Spain' },
  'd. olmo': { countryCode: 'es', countryName: 'Spain' },
  '올모': { countryCode: 'es', countryName: 'Spain' },
  '다니 올모': { countryCode: 'es', countryName: 'Spain' },
  'casado': { countryCode: 'es', countryName: 'Spain' },
  'm. casado': { countryCode: 'es', countryName: 'Spain' },
  '카사도': { countryCode: 'es', countryName: 'Spain' },
  'de jong': { countryCode: 'nl', countryName: 'Netherlands' },
  'f. de jong': { countryCode: 'nl', countryName: 'Netherlands' },
  '프렝키 더용': { countryCode: 'nl', countryName: 'Netherlands' },
  '더용': { countryCode: 'nl', countryName: 'Netherlands' },
  'cubarsi': { countryCode: 'es', countryName: 'Spain' },
  'p. cubarsi': { countryCode: 'es', countryName: 'Spain' },
  '쿠바르시': { countryCode: 'es', countryName: 'Spain' },
  'kounde': { countryCode: 'fr', countryName: 'France' },
  'j. kounde': { countryCode: 'fr', countryName: 'France' },
  '쿤데': { countryCode: 'fr', countryName: 'France' },
  'balde': { countryCode: 'es', countryName: 'Spain' },
  'a. balde': { countryCode: 'es', countryName: 'Spain' },
  '발데': { countryCode: 'es', countryName: 'Spain' },
  'ter stegen': { countryCode: 'de', countryName: 'Germany' },
  '테어 슈테겐': { countryCode: 'de', countryName: 'Germany' },
  'szczesny': { countryCode: 'pl', countryName: 'Poland' },
  '슈체스니': { countryCode: 'pl', countryName: 'Poland' },

  // Atletico Madrid
  'oblak': { countryCode: 'si', countryName: 'Slovenia' },
  'j. oblak': { countryCode: 'si', countryName: 'Slovenia' },
  '오블락': { countryCode: 'si', countryName: 'Slovenia' },
  'j. alvarez': { countryCode: 'ar', countryName: 'Argentina' },
  'alvarez': { countryCode: 'ar', countryName: 'Argentina' },
  '알바레스': { countryCode: 'ar', countryName: 'Argentina' },
  '훌리안 알바레스': { countryCode: 'ar', countryName: 'Argentina' },
  'griezmann': { countryCode: 'fr', countryName: 'France' },
  'a. griezmann': { countryCode: 'fr', countryName: 'France' },
  '그리즈만': { countryCode: 'fr', countryName: 'France' },
  'gallagher': { countryCode: 'gb-eng', countryName: 'England' },
  'c. gallagher': { countryCode: 'gb-eng', countryName: 'England' },
  '갤러거': { countryCode: 'gb-eng', countryName: 'England' },
  'sorloth': { countryCode: 'no', countryName: 'Norway' },
  'sørloth': { countryCode: 'no', countryName: 'Norway' },
  '쇠를로트': { countryCode: 'no', countryName: 'Norway' },
  'de paul': { countryCode: 'ar', countryName: 'Argentina' },
  'r. de paul': { countryCode: 'ar', countryName: 'Argentina' },
  '데 폴': { countryCode: 'ar', countryName: 'Argentina' },
  'koke': { countryCode: 'es', countryName: 'Spain' },
  '코케': { countryCode: 'es', countryName: 'Spain' },
  'llorente': { countryCode: 'es', countryName: 'Spain' },
  'm. llorente': { countryCode: 'es', countryName: 'Spain' },
  '요렌테': { countryCode: 'es', countryName: 'Spain' },
  'le normand': { countryCode: 'es', countryName: 'Spain' },
  '르 노르망': { countryCode: 'es', countryName: 'Spain' },
  'gimenez': { countryCode: 'uy', countryName: 'Uruguay' },
  '히메네스': { countryCode: 'uy', countryName: 'Uruguay' },
  'reinildo': { countryCode: 'mz', countryName: 'Mozambique' },
  '레이닐두': { countryCode: 'mz', countryName: 'Mozambique' },

  // Manchester City
  'haaland': { countryCode: 'no', countryName: 'Norway' },
  'e. haaland': { countryCode: 'no', countryName: 'Norway' },
  '홀란드': { countryCode: 'no', countryName: 'Norway' },
  'de bruyne': { countryCode: 'be', countryName: 'Belgium' },
  'k. de bruyne': { countryCode: 'be', countryName: 'Belgium' },
  '더브라위너': { countryCode: 'be', countryName: 'Belgium' },
  'rodri': { countryCode: 'es', countryName: 'Spain' },
  '로드리': { countryCode: 'es', countryName: 'Spain' },
  'foden': { countryCode: 'gb-eng', countryName: 'England' },
  'p. foden': { countryCode: 'gb-eng', countryName: 'England' },
  '포든': { countryCode: 'gb-eng', countryName: 'England' },
  'bernardo': { countryCode: 'pt', countryName: 'Portugal' },
  'b. silva': { countryCode: 'pt', countryName: 'Portugal' },
  '실바': { countryCode: 'pt', countryName: 'Portugal' },
  '베르나르두 실바': { countryCode: 'pt', countryName: 'Portugal' },
  'gundogan': { countryCode: 'de', countryName: 'Germany' },
  'gündoğan': { countryCode: 'de', countryName: 'Germany' },
  '귄도안': { countryCode: 'de', countryName: 'Germany' },
  'doku': { countryCode: 'be', countryName: 'Belgium' },
  'j. doku': { countryCode: 'be', countryName: 'Belgium' },
  '도쿠': { countryCode: 'be', countryName: 'Belgium' },
  'savinho': { countryCode: 'br', countryName: 'Brazil' },
  '사비뉴': { countryCode: 'br', countryName: 'Brazil' },
  'kovacic': { countryCode: 'hr', countryName: 'Croatia' },
  '코바치치': { countryCode: 'hr', countryName: 'Croatia' },
  'gvardiol': { countryCode: 'hr', countryName: 'Croatia' },
  'j. gvardiol': { countryCode: 'hr', countryName: 'Croatia' },
  '그바르디올': { countryCode: 'hr', countryName: 'Croatia' },
  'ruben dias': { countryCode: 'pt', countryName: 'Portugal' },
  'r. dias': { countryCode: 'pt', countryName: 'Portugal' },
  '디아스': { countryCode: 'pt', countryName: 'Portugal' },
  '후벵 디아스': { countryCode: 'pt', countryName: 'Portugal' },
  'akanji': { countryCode: 'ch', countryName: 'Switzerland' },
  'm. akanji': { countryCode: 'ch', countryName: 'Switzerland' },
  '아칸지': { countryCode: 'ch', countryName: 'Switzerland' },
  'walker': { countryCode: 'gb-eng', countryName: 'England' },
  'k. walker': { countryCode: 'gb-eng', countryName: 'England' },
  '워커': { countryCode: 'gb-eng', countryName: 'England' },
  'ederson': { countryCode: 'br', countryName: 'Brazil' },
  '에데르송': { countryCode: 'br', countryName: 'Brazil' },

  // Arsenal
  'saka': { countryCode: 'gb-eng', countryName: 'England' },
  'b. saka': { countryCode: 'gb-eng', countryName: 'England' },
  '사카': { countryCode: 'gb-eng', countryName: 'England' },
  '부카요 사카': { countryCode: 'gb-eng', countryName: 'England' },
  'havertz': { countryCode: 'de', countryName: 'Germany' },
  'k. havertz': { countryCode: 'de', countryName: 'Germany' },
  '하베르츠': { countryCode: 'de', countryName: 'Germany' },
  'martinelli': { countryCode: 'br', countryName: 'Brazil' },
  'g. martinelli': { countryCode: 'br', countryName: 'Brazil' },
  '마르티넬리': { countryCode: 'br', countryName: 'Brazil' },
  'odegaard': { countryCode: 'no', countryName: 'Norway' },
  'ødegaard': { countryCode: 'no', countryName: 'Norway' },
  'm. odegaard': { countryCode: 'no', countryName: 'Norway' },
  '외데고르': { countryCode: 'no', countryName: 'Norway' },
  '외데가르드': { countryCode: 'no', countryName: 'Norway' },
  'rice': { countryCode: 'gb-eng', countryName: 'England' },
  'd. rice': { countryCode: 'gb-eng', countryName: 'England' },
  '라이스': { countryCode: 'gb-eng', countryName: 'England' },
  '데클란 라이스': { countryCode: 'gb-eng', countryName: 'England' },
  'partey': { countryCode: 'gh', countryName: 'Ghana' },
  't. partey': { countryCode: 'gh', countryName: 'Ghana' },
  '파티': { countryCode: 'gh', countryName: 'Ghana' },
  'merino': { countryCode: 'es', countryName: 'Spain' },
  'm. merino': { countryCode: 'es', countryName: 'Spain' },
  '메리노': { countryCode: 'es', countryName: 'Spain' },
  'saliba': { countryCode: 'fr', countryName: 'France' },
  'w. saliba': { countryCode: 'fr', countryName: 'France' },
  '살리바': { countryCode: 'fr', countryName: 'France' },
  '윌리엄 살리바': { countryCode: 'fr', countryName: 'France' },
  'gabriel': { countryCode: 'br', countryName: 'Brazil' },
  '마갈량이스': { countryCode: 'br', countryName: 'Brazil' },
  '가브리에우': { countryCode: 'br', countryName: 'Brazil' },
  'white': { countryCode: 'gb-eng', countryName: 'England' },
  'b. white': { countryCode: 'gb-eng', countryName: 'England' },
  '화이트': { countryCode: 'gb-eng', countryName: 'England' },
  '벤 화이트': { countryCode: 'gb-eng', countryName: 'England' },
  'timber': { countryCode: 'nl', countryName: 'Netherlands' },
  'j. timber': { countryCode: 'nl', countryName: 'Netherlands' },
  '팀버': { countryCode: 'nl', countryName: 'Netherlands' },
  'raya': { countryCode: 'es', countryName: 'Spain' },
  'd. raya': { countryCode: 'es', countryName: 'Spain' },
  '라야': { countryCode: 'es', countryName: 'Spain' },
  '다비드 라야': { countryCode: 'es', countryName: 'Spain' },
  'calafiori': { countryCode: 'it', countryName: 'Italy' },
  'r. calafiori': { countryCode: 'it', countryName: 'Italy' },
  '칼라피오리': { countryCode: 'it', countryName: 'Italy' },
  'trossard': { countryCode: 'be', countryName: 'Belgium' },
  'l. trossard': { countryCode: 'be', countryName: 'Belgium' },
  '트로사르': { countryCode: 'be', countryName: 'Belgium' },

  // Liverpool
  'salah': { countryCode: 'eg', countryName: 'Egypt' },
  'm. salah': { countryCode: 'eg', countryName: 'Egypt' },
  '살라': { countryCode: 'eg', countryName: 'Egypt' },
  '모하메드 살라': { countryCode: 'eg', countryName: 'Egypt' },
  'luis diaz': { countryCode: 'co', countryName: 'Colombia' },
  'l. diaz': { countryCode: 'co', countryName: 'Colombia' },
  '루이스 디아스': { countryCode: 'co', countryName: 'Colombia' },
  'nunez': { countryCode: 'uy', countryName: 'Uruguay' },
  'núñez': { countryCode: 'uy', countryName: 'Uruguay' },
  'd. nunez': { countryCode: 'uy', countryName: 'Uruguay' },
  '누녜스': { countryCode: 'uy', countryName: 'Uruguay' },
  'gakpo': { countryCode: 'nl', countryName: 'Netherlands' },
  'c. gakpo': { countryCode: 'nl', countryName: 'Netherlands' },
  '각포': { countryCode: 'nl', countryName: 'Netherlands' },
  'jota': { countryCode: 'pt', countryName: 'Portugal' },
  'd. jota': { countryCode: 'pt', countryName: 'Portugal' },
  '조타': { countryCode: 'pt', countryName: 'Portugal' },
  'szoboszlai': { countryCode: 'hu', countryName: 'Hungary' },
  'd. szoboszlai': { countryCode: 'hu', countryName: 'Hungary' },
  '소보슬러이': { countryCode: 'hu', countryName: 'Hungary' },
  'mac allister': { countryCode: 'ar', countryName: 'Argentina' },
  'a. mac allister': { countryCode: 'ar', countryName: 'Argentina' },
  '맥 앨리스터': { countryCode: 'ar', countryName: 'Argentina' },
  'gravenberch': { countryCode: 'nl', countryName: 'Netherlands' },
  'r. gravenberch': { countryCode: 'nl', countryName: 'Netherlands' },
  '흐라번베르흐': { countryCode: 'nl', countryName: 'Netherlands' },
  'van dijk': { countryCode: 'nl', countryName: 'Netherlands' },
  'v. van dijk': { countryCode: 'nl', countryName: 'Netherlands' },
  '반다이크': { countryCode: 'nl', countryName: 'Netherlands' },
  '반 다이크': { countryCode: 'nl', countryName: 'Netherlands' },
  'konate': { countryCode: 'fr', countryName: 'France' },
  'konaté': { countryCode: 'fr', countryName: 'France' },
  'i. konate': { countryCode: 'fr', countryName: 'France' },
  '코나테': { countryCode: 'fr', countryName: 'France' },
  'alexander-arnold': { countryCode: 'gb-eng', countryName: 'England' },
  't. alexander-arnold': { countryCode: 'gb-eng', countryName: 'England' },
  '아놀드': { countryCode: 'gb-eng', countryName: 'England' },
  '트렌트 아놀드': { countryCode: 'gb-eng', countryName: 'England' },
  'robertson': { countryCode: 'gb-sct', countryName: 'Scotland' },
  'a. robertson': { countryCode: 'gb-sct', countryName: 'Scotland' },
  '로버트슨': { countryCode: 'gb-sct', countryName: 'Scotland' },
  'alisson': { countryCode: 'br', countryName: 'Brazil' },
  '알리송': { countryCode: 'br', countryName: 'Brazil' },
  'kelleher': { countryCode: 'ie', countryName: 'Ireland' },
  '켈러허': { countryCode: 'ie', countryName: 'Ireland' },

  // Chelsea
  'palmer': { countryCode: 'gb-eng', countryName: 'England' },
  'c. palmer': { countryCode: 'gb-eng', countryName: 'England' },
  '콜 파머': { countryCode: 'gb-eng', countryName: 'England' },
  '파머': { countryCode: 'gb-eng', countryName: 'England' },
  'n. jackson': { countryCode: 'sn', countryName: 'Senegal' },
  'jackson': { countryCode: 'sn', countryName: 'Senegal' },
  '잭슨': { countryCode: 'sn', countryName: 'Senegal' },
  '니콜라 잭슨': { countryCode: 'sn', countryName: 'Senegal' },
  'madueke': { countryCode: 'gb-eng', countryName: 'England' },
  'n. madueke': { countryCode: 'gb-eng', countryName: 'England' },
  '마두에케': { countryCode: 'gb-eng', countryName: 'England' },
  'pedro neto': { countryCode: 'pt', countryName: 'Portugal' },
  'p. neto': { countryCode: 'pt', countryName: 'Portugal' },
  '네투': { countryCode: 'pt', countryName: 'Portugal' },
  'nkunku': { countryCode: 'fr', countryName: 'France' },
  'c. nkunku': { countryCode: 'fr', countryName: 'France' },
  '은쿤쿠': { countryCode: 'fr', countryName: 'France' },
  'enzo': { countryCode: 'ar', countryName: 'Argentina' },
  'enzo fernandez': { countryCode: 'ar', countryName: 'Argentina' },
  'e. fernandez': { countryCode: 'ar', countryName: 'Argentina' },
  '엔조': { countryCode: 'ar', countryName: 'Argentina' },
  '엔조 페르난데스': { countryCode: 'ar', countryName: 'Argentina' },
  'caicedo': { countryCode: 'ec', countryName: 'Ecuador' },
  'm. caicedo': { countryCode: 'ec', countryName: 'Ecuador' },
  '카이세도': { countryCode: 'ec', countryName: 'Ecuador' },
  'lavia': { countryCode: 'be', countryName: 'Belgium' },
  'r. lavia': { countryCode: 'be', countryName: 'Belgium' },
  '라비아': { countryCode: 'be', countryName: 'Belgium' },
  'colwill': { countryCode: 'gb-eng', countryName: 'England' },
  'l. colwill': { countryCode: 'gb-eng', countryName: 'England' },
  '콜윌': { countryCode: 'gb-eng', countryName: 'England' },
  'fofana': { countryCode: 'fr', countryName: 'France' },
  'w. fofana': { countryCode: 'fr', countryName: 'France' },
  '포파나': { countryCode: 'fr', countryName: 'France' },
  'cucurella': { countryCode: 'es', countryName: 'Spain' },
  'm. cucurella': { countryCode: 'es', countryName: 'Spain' },
  '쿠쿠렐라': { countryCode: 'es', countryName: 'Spain' },
  'gusto': { countryCode: 'fr', countryName: 'France' },
  'm. gusto': { countryCode: 'fr', countryName: 'France' },
  '귀스토': { countryCode: 'fr', countryName: 'France' },
  '구스토': { countryCode: 'fr', countryName: 'France' },
  'robert sanchez': { countryCode: 'es', countryName: 'Spain' },
  'r. sanchez': { countryCode: 'es', countryName: 'Spain' },
  '산체스': { countryCode: 'es', countryName: 'Spain' },
  'reece james': { countryCode: 'gb-eng', countryName: 'England' },
  'r. james': { countryCode: 'gb-eng', countryName: 'England' },
  '리스 제임스': { countryCode: 'gb-eng', countryName: 'England' },

  // Tottenham Hotspur
  'son': { countryCode: 'kr', countryName: 'South Korea' },
  'h. son': { countryCode: 'kr', countryName: 'South Korea' },
  'heung-min son': { countryCode: 'kr', countryName: 'South Korea' },
  '손흥민': { countryCode: 'kr', countryName: 'South Korea' },
  'solanke': { countryCode: 'gb-eng', countryName: 'England' },
  'd. solanke': { countryCode: 'gb-eng', countryName: 'England' },
  '솔랑케': { countryCode: 'gb-eng', countryName: 'England' },
  'b. johnson': { countryCode: 'gb-wls', countryName: 'Wales' },
  '브레넌 존슨': { countryCode: 'gb-wls', countryName: 'Wales' },
  '존슨': { countryCode: 'gb-wls', countryName: 'Wales' },
  'kulusevski': { countryCode: 'se', countryName: 'Sweden' },
  'd. kulusevski': { countryCode: 'se', countryName: 'Sweden' },
  '쿨루셰프스키': { countryCode: 'se', countryName: 'Sweden' },
  'maddison': { countryCode: 'gb-eng', countryName: 'England' },
  'j. maddison': { countryCode: 'gb-eng', countryName: 'England' },
  '매디슨': { countryCode: 'gb-eng', countryName: 'England' },
  '제임스 매디슨': { countryCode: 'gb-eng', countryName: 'England' },
  'bentancur': { countryCode: 'uy', countryName: 'Uruguay' },
  'r. bentancur': { countryCode: 'uy', countryName: 'Uruguay' },
  '벤탄쿠르': { countryCode: 'uy', countryName: 'Uruguay' },
  'bissouma': { countryCode: 'ml', countryName: 'Mali' },
  'y. bissouma': { countryCode: 'ml', countryName: 'Mali' },
  '비수마': { countryCode: 'ml', countryName: 'Mali' },
  'p. sarr': { countryCode: 'sn', countryName: 'Senegal' },
  '사르': { countryCode: 'sn', countryName: 'Senegal' },
  'c. romero': { countryCode: 'ar', countryName: 'Argentina' },
  '로메로': { countryCode: 'ar', countryName: 'Argentina' },
  '크리스티안 로메로': { countryCode: 'ar', countryName: 'Argentina' },
  'van de ven': { countryCode: 'nl', countryName: 'Netherlands' },
  'm. van de ven': { countryCode: 'nl', countryName: 'Netherlands' },
  '판더펜': { countryCode: 'nl', countryName: 'Netherlands' },
  'porro': { countryCode: 'es', countryName: 'Spain' },
  'p. porro': { countryCode: 'es', countryName: 'Spain' },
  '포로': { countryCode: 'es', countryName: 'Spain' },
  'udogie': { countryCode: 'it', countryName: 'Italy' },
  'd. udogie': { countryCode: 'it', countryName: 'Italy' },
  '우도기': { countryCode: 'it', countryName: 'Italy' },
  'vicario': { countryCode: 'it', countryName: 'Italy' },
  'g. vicario': { countryCode: 'it', countryName: 'Italy' },
  '비카리오': { countryCode: 'it', countryName: 'Italy' },

  // Manchester United
  'bruno fernandes': { countryCode: 'pt', countryName: 'Portugal' },
  'b. fernandes': { countryCode: 'pt', countryName: 'Portugal' },
  '브루노 페르난데스': { countryCode: 'pt', countryName: 'Portugal' },
  '브루노': { countryCode: 'pt', countryName: 'Portugal' },
  'rashford': { countryCode: 'gb-eng', countryName: 'England' },
  'm. rashford': { countryCode: 'gb-eng', countryName: 'England' },
  '래시포드': { countryCode: 'gb-eng', countryName: 'England' },
  'hojlund': { countryCode: 'dk', countryName: 'Denmark' },
  'højlund': { countryCode: 'dk', countryName: 'Denmark' },
  'r. hojlund': { countryCode: 'dk', countryName: 'Denmark' },
  '호일룬': { countryCode: 'dk', countryName: 'Denmark' },
  'garnacho': { countryCode: 'ar', countryName: 'Argentina' },
  'a. garnacho': { countryCode: 'ar', countryName: 'Argentina' },
  '가르나초': { countryCode: 'ar', countryName: 'Argentina' },
  'mainoo': { countryCode: 'gb-eng', countryName: 'England' },
  'k. mainoo': { countryCode: 'gb-eng', countryName: 'England' },
  '마이누': { countryCode: 'gb-eng', countryName: 'England' },
  'casemiro': { countryCode: 'br', countryName: 'Brazil' },
  '카세미루': { countryCode: 'br', countryName: 'Brazil' },
  'ugarte': { countryCode: 'uy', countryName: 'Uruguay' },
  'm. ugarte': { countryCode: 'uy', countryName: 'Uruguay' },
  '우가르테': { countryCode: 'uy', countryName: 'Uruguay' },
  'l. martinez': { countryCode: 'ar', countryName: 'Argentina' },
  '리산드로 마르티네스': { countryCode: 'ar', countryName: 'Argentina' },
  'de ligt': { countryCode: 'nl', countryName: 'Netherlands' },
  'm. de ligt': { countryCode: 'nl', countryName: 'Netherlands' },
  '더리흐트': { countryCode: 'nl', countryName: 'Netherlands' },
  'mazraoui': { countryCode: 'ma', countryName: 'Morocco' },
  'n. mazraoui': { countryCode: 'ma', countryName: 'Morocco' },
  '마즈라위': { countryCode: 'ma', countryName: 'Morocco' },
  'dalot': { countryCode: 'pt', countryName: 'Portugal' },
  'd. dalot': { countryCode: 'pt', countryName: 'Portugal' },
  '달로트': { countryCode: 'pt', countryName: 'Portugal' },
  'onana': { countryCode: 'cm', countryName: 'Cameroon' },
  'a. onana': { countryCode: 'cm', countryName: 'Cameroon' },
  '오나나': { countryCode: 'cm', countryName: 'Cameroon' },
  '안드레 오나나': { countryCode: 'cm', countryName: 'Cameroon' },

  // Newcastle United
  'isak': { countryCode: 'se', countryName: 'Sweden' },
  'a. isak': { countryCode: 'se', countryName: 'Sweden' },
  '이삭': { countryCode: 'se', countryName: 'Sweden' },
  '알렉산더 이삭': { countryCode: 'se', countryName: 'Sweden' },
  'gordon': { countryCode: 'gb-eng', countryName: 'England' },
  'a. gordon': { countryCode: 'gb-eng', countryName: 'England' },
  '앤서니 고든': { countryCode: 'gb-eng', countryName: 'England' },
  '고든': { countryCode: 'gb-eng', countryName: 'England' },
  'barnes': { countryCode: 'gb-eng', countryName: 'England' },
  'h. barnes': { countryCode: 'gb-eng', countryName: 'England' },
  '반스': { countryCode: 'gb-eng', countryName: 'England' },
  'joelinton': { countryCode: 'br', countryName: 'Brazil' },
  '조엘린톤': { countryCode: 'br', countryName: 'Brazil' },
  'bruno guimaraes': { countryCode: 'br', countryName: 'Brazil' },
  'b. guimaraes': { countryCode: 'br', countryName: 'Brazil' },
  '기마랑이스': { countryCode: 'br', countryName: 'Brazil' },
  'tonali': { countryCode: 'it', countryName: 'Italy' },
  's. tonali': { countryCode: 'it', countryName: 'Italy' },
  '토날리': { countryCode: 'it', countryName: 'Italy' },
  'schar': { countryCode: 'ch', countryName: 'Switzerland' },
  'schär': { countryCode: 'ch', countryName: 'Switzerland' },
  'f. schar': { countryCode: 'ch', countryName: 'Switzerland' },
  '셰어': { countryCode: 'ch', countryName: 'Switzerland' },
  'burn': { countryCode: 'gb-eng', countryName: 'England' },
  'd. burn': { countryCode: 'gb-eng', countryName: 'England' },
  '댄 번': { countryCode: 'gb-eng', countryName: 'England' },
  'trippier': { countryCode: 'gb-eng', countryName: 'England' },
  'k. trippier': { countryCode: 'gb-eng', countryName: 'England' },
  '트리피어': { countryCode: 'gb-eng', countryName: 'England' },
  'livramento': { countryCode: 'gb-eng', countryName: 'England' },
  't. livramento': { countryCode: 'gb-eng', countryName: 'England' },
  '리브라멘토': { countryCode: 'gb-eng', countryName: 'England' },
  'pope': { countryCode: 'gb-eng', countryName: 'England' },
  'n. pope': { countryCode: 'gb-eng', countryName: 'England' },
  '닉 포프': { countryCode: 'gb-eng', countryName: 'England' },
  '포프': { countryCode: 'gb-eng', countryName: 'England' },

  // Aston Villa
  'watkins': { countryCode: 'gb-eng', countryName: 'England' },
  'o. watkins': { countryCode: 'gb-eng', countryName: 'England' },
  '왓킨스': { countryCode: 'gb-eng', countryName: 'England' },
  '올리 왓킨스': { countryCode: 'gb-eng', countryName: 'England' },
  'j. duran': { countryCode: 'co', countryName: 'Colombia' },
  '두란': { countryCode: 'co', countryName: 'Colombia' },
  'l. bailey': { countryCode: 'jm', countryName: 'Jamaica' },
  '베일리': { countryCode: 'jm', countryName: 'Jamaica' },
  'mcginn': { countryCode: 'gb-sct', countryName: 'Scotland' },
  'j. mcginn': { countryCode: 'gb-sct', countryName: 'Scotland' },
  '맥긴': { countryCode: 'gb-sct', countryName: 'Scotland' },
  'tielemans': { countryCode: 'be', countryName: 'Belgium' },
  'y. tielemans': { countryCode: 'be', countryName: 'Belgium' },
  '틸레만스': { countryCode: 'be', countryName: 'Belgium' },
  'amadou onana': { countryCode: 'be', countryName: 'Belgium' },
  'am. onana': { countryCode: 'be', countryName: 'Belgium' },
  '아마두 오나나': { countryCode: 'be', countryName: 'Belgium' },
  'm. rogers': { countryCode: 'gb-eng', countryName: 'England' },
  '로저스': { countryCode: 'gb-eng', countryName: 'England' },
  'pau torres': { countryCode: 'es', countryName: 'Spain' },
  '파우 토레스': { countryCode: 'es', countryName: 'Spain' },
  'konsa': { countryCode: 'gb-eng', countryName: 'England' },
  'e. konsa': { countryCode: 'gb-eng', countryName: 'England' },
  '콘사': { countryCode: 'gb-eng', countryName: 'England' },
  'digne': { countryCode: 'fr', countryName: 'France' },
  'l. digne': { countryCode: 'fr', countryName: 'France' },
  '디뉴': { countryCode: 'fr', countryName: 'France' },
  'm. cash': { countryCode: 'pl', countryName: 'Poland' },
  '캐시': { countryCode: 'pl', countryName: 'Poland' },
  'e. martinez': { countryCode: 'ar', countryName: 'Argentina' },
  '에밀리아노 마르티네스': { countryCode: 'ar', countryName: 'Argentina' },

  // Bayern Munich
  'kane': { countryCode: 'gb-eng', countryName: 'England' },
  'h. kane': { countryCode: 'gb-eng', countryName: 'England' },
  '케인': { countryCode: 'gb-eng', countryName: 'England' },
  '해리 케인': { countryCode: 'gb-eng', countryName: 'England' },
  'musiala': { countryCode: 'de', countryName: 'Germany' },
  'j. musiala': { countryCode: 'de', countryName: 'Germany' },
  '무시알라': { countryCode: 'de', countryName: 'Germany' },
  'olise': { countryCode: 'fr', countryName: 'France' },
  'm. olise': { countryCode: 'fr', countryName: 'France' },
  '올리세': { countryCode: 'fr', countryName: 'France' },
  'gnabry': { countryCode: 'de', countryName: 'Germany' },
  's. gnabry': { countryCode: 'de', countryName: 'Germany' },
  '그나브리': { countryCode: 'de', countryName: 'Germany' },
  'sane': { countryCode: 'de', countryName: 'Germany' },
  'sané': { countryCode: 'de', countryName: 'Germany' },
  'l. sane': { countryCode: 'de', countryName: 'Germany' },
  '자네': { countryCode: 'de', countryName: 'Germany' },
  'kimmich': { countryCode: 'de', countryName: 'Germany' },
  'j. kimmich': { countryCode: 'de', countryName: 'Germany' },
  '키미히': { countryCode: 'de', countryName: 'Germany' },
  'pavlovic': { countryCode: 'de', countryName: 'Germany' },
  'pavlović': { countryCode: 'de', countryName: 'Germany' },
  '파블로비치': { countryCode: 'de', countryName: 'Germany' },
  'palhinha': { countryCode: 'pt', countryName: 'Portugal' },
  'j. palhinha': { countryCode: 'pt', countryName: 'Portugal' },
  '팔리냐': { countryCode: 'pt', countryName: 'Portugal' },
  'a. davies': { countryCode: 'ca', countryName: 'Canada' },
  '알폰소 데이비스': { countryCode: 'ca', countryName: 'Canada' },
  'min-jae kim': { countryCode: 'kr', countryName: 'South Korea' },
  'm. kim': { countryCode: 'kr', countryName: 'South Korea' },
  '김민재': { countryCode: 'kr', countryName: 'South Korea' },
  'upamecano': { countryCode: 'fr', countryName: 'France' },
  'd. upamecano': { countryCode: 'fr', countryName: 'France' },
  '우파메카노': { countryCode: 'fr', countryName: 'France' },
  'guerreiro': { countryCode: 'pt', countryName: 'Portugal' },
  'r. guerreiro': { countryCode: 'pt', countryName: 'Portugal' },
  '게헤이루': { countryCode: 'pt', countryName: 'Portugal' },
  'neuer': { countryCode: 'de', countryName: 'Germany' },
  'm. neuer': { countryCode: 'de', countryName: 'Germany' },
  '노이어': { countryCode: 'de', countryName: 'Germany' },

  // Bayer Leverkusen
  'wirtz': { countryCode: 'de', countryName: 'Germany' },
  'f. wirtz': { countryCode: 'de', countryName: 'Germany' },
  '비르츠': { countryCode: 'de', countryName: 'Germany' },
  'boniface': { countryCode: 'ng', countryName: 'Nigeria' },
  'v. boniface': { countryCode: 'ng', countryName: 'Nigeria' },
  '보니페이스': { countryCode: 'ng', countryName: 'Nigeria' },
  'schick': { countryCode: 'cz', countryName: 'Czech Republic' },
  'p. schick': { countryCode: 'cz', countryName: 'Czech Republic' },
  '시크': { countryCode: 'cz', countryName: 'Czech Republic' },
  'frimpong': { countryCode: 'nl', countryName: 'Netherlands' },
  'j. frimpong': { countryCode: 'nl', countryName: 'Netherlands' },
  '프림퐁': { countryCode: 'nl', countryName: 'Netherlands' },
  'grimaldo': { countryCode: 'es', countryName: 'Spain' },
  'a. grimaldo': { countryCode: 'es', countryName: 'Spain' },
  '그리말도': { countryCode: 'es', countryName: 'Spain' },
  'xhaka': { countryCode: 'ch', countryName: 'Switzerland' },
  'g. xhaka': { countryCode: 'ch', countryName: 'Switzerland' },
  '자카': { countryCode: 'ch', countryName: 'Switzerland' },
  'andrich': { countryCode: 'de', countryName: 'Germany' },
  'r. andrich': { countryCode: 'de', countryName: 'Germany' },
  '안드리히': { countryCode: 'de', countryName: 'Germany' },
  'tah': { countryCode: 'de', countryName: 'Germany' },
  'j. tah': { countryCode: 'de', countryName: 'Germany' },
  '요나단 타': { countryCode: 'de', countryName: 'Germany' },
  '타': { countryCode: 'de', countryName: 'Germany' },
  'tapsoba': { countryCode: 'bf', countryName: 'Burkina Faso' },
  'e. tapsoba': { countryCode: 'bf', countryName: 'Burkina Faso' },
  '탑소바': { countryCode: 'bf', countryName: 'Burkina Faso' },
  'hincapie': { countryCode: 'ec', countryName: 'Ecuador' },
  'hincapié': { countryCode: 'ec', countryName: 'Ecuador' },
  'p. hincapie': { countryCode: 'ec', countryName: 'Ecuador' },
  '인카피에': { countryCode: 'ec', countryName: 'Ecuador' },
  'hradecky': { countryCode: 'fi', countryName: 'Finland' },
  'l. hradecky': { countryCode: 'fi', countryName: 'Finland' },
  '흐라데키': { countryCode: 'fi', countryName: 'Finland' },

  // Borussia Dortmund
  'guirassy': { countryCode: 'gn', countryName: 'Guinea' },
  's. guirassy': { countryCode: 'gn', countryName: 'Guinea' },
  '기라시': { countryCode: 'gn', countryName: 'Guinea' },
  'adeyemi': { countryCode: 'de', countryName: 'Germany' },
  'k. adeyemi': { countryCode: 'de', countryName: 'Germany' },
  '아데예미': { countryCode: 'de', countryName: 'Germany' },
  'brandt': { countryCode: 'de', countryName: 'Germany' },
  'j. brandt': { countryCode: 'de', countryName: 'Germany' },
  '브란트': { countryCode: 'de', countryName: 'Germany' },
  'sabitzer': { countryCode: 'at', countryName: 'Austria' },
  'm. sabitzer': { countryCode: 'at', countryName: 'Austria' },
  '자비처': { countryCode: 'at', countryName: 'Austria' },
  'emre can': { countryCode: 'de', countryName: 'Germany' },
  'e. can': { countryCode: 'de', countryName: 'Germany' },
  '엠레 잔': { countryCode: 'de', countryName: 'Germany' },
  'schlotterbeck': { countryCode: 'de', countryName: 'Germany' },
  'n. schlotterbeck': { countryCode: 'de', countryName: 'Germany' },
  '슐로터베크': { countryCode: 'de', countryName: 'Germany' },
  'kobel': { countryCode: 'ch', countryName: 'Switzerland' },
  'g. kobel': { countryCode: 'ch', countryName: 'Switzerland' },
  '코벨': { countryCode: 'ch', countryName: 'Switzerland' },

  // Paris Saint-Germain
  'dembele': { countryCode: 'fr', countryName: 'France' },
  'dembélé': { countryCode: 'fr', countryName: 'France' },
  'o. dembele': { countryCode: 'fr', countryName: 'France' },
  '뎀벨레': { countryCode: 'fr', countryName: 'France' },
  'barcola': { countryCode: 'fr', countryName: 'France' },
  'b. barcola': { countryCode: 'fr', countryName: 'France' },
  '바르콜라': { countryCode: 'fr', countryName: 'France' },
  'kang-in lee': { countryCode: 'kr', countryName: 'South Korea' },
  'k. lee': { countryCode: 'kr', countryName: 'South Korea' },
  '이강인': { countryCode: 'kr', countryName: 'South Korea' },
  'vitinha': { countryCode: 'pt', countryName: 'Portugal' },
  '비티냐': { countryCode: 'pt', countryName: 'Portugal' },
  'fabian ruiz': { countryCode: 'es', countryName: 'Spain' },
  '파비안 루이스': { countryCode: 'es', countryName: 'Spain' },
  'zaire-emery': { countryCode: 'fr', countryName: 'France' },
  'w. zaire-emery': { countryCode: 'fr', countryName: 'France' },
  '자이르-에메리': { countryCode: 'fr', countryName: 'France' },
  'joao neves': { countryCode: 'pt', countryName: 'Portugal' },
  'j. neves': { countryCode: 'pt', countryName: 'Portugal' },
  '주앙 네베스': { countryCode: 'pt', countryName: 'Portugal' },
  'hakimi': { countryCode: 'ma', countryName: 'Morocco' },
  'a. hakimi': { countryCode: 'ma', countryName: 'Morocco' },
  '하키미': { countryCode: 'ma', countryName: 'Morocco' },
  '아슈라프 하키미': { countryCode: 'ma', countryName: 'Morocco' },
  'marquinhos': { countryCode: 'br', countryName: 'Brazil' },
  '마르퀴뇨스': { countryCode: 'br', countryName: 'Brazil' },
  'pacho': { countryCode: 'ec', countryName: 'Ecuador' },
  'w. pacho': { countryCode: 'ec', countryName: 'Ecuador' },
  '파초': { countryCode: 'ec', countryName: 'Ecuador' },
  'nuno mendes': { countryCode: 'pt', countryName: 'Portugal' },
  'n. mendes': { countryCode: 'pt', countryName: 'Portugal' },
  '누누 멘데스': { countryCode: 'pt', countryName: 'Portugal' },
  'donnarumma': { countryCode: 'it', countryName: 'Italy' },
  'g. donnarumma': { countryCode: 'it', countryName: 'Italy' },
  '돈나룸마': { countryCode: 'it', countryName: 'Italy' },

  // Inter Milan
  'lautaro': { countryCode: 'ar', countryName: 'Argentina' },
  'lautaro martinez': { countryCode: 'ar', countryName: 'Argentina' },
  '라우타로': { countryCode: 'ar', countryName: 'Argentina' },
  'thuram': { countryCode: 'fr', countryName: 'France' },
  'm. thuram': { countryCode: 'fr', countryName: 'France' },
  '튀랑': { countryCode: 'fr', countryName: 'France' },
  'taremi': { countryCode: 'ir', countryName: 'Iran' },
  '타레미': { countryCode: 'ir', countryName: 'Iran' },
  'barella': { countryCode: 'it', countryName: 'Italy' },
  'n. barella': { countryCode: 'it', countryName: 'Italy' },
  '바렐라': { countryCode: 'it', countryName: 'Italy' },
  'calhanoglu': { countryCode: 'tr', countryName: 'Turkey' },
  'çalhanoğlu': { countryCode: 'tr', countryName: 'Turkey' },
  '찰하놀루': { countryCode: 'tr', countryName: 'Turkey' },
  'mkhitaryan': { countryCode: 'am', countryName: 'Armenia' },
  '미키타리안': { countryCode: 'am', countryName: 'Armenia' },
  'dimarco': { countryCode: 'it', countryName: 'Italy' },
  'f. dimarco': { countryCode: 'it', countryName: 'Italy' },
  '디마르코': { countryCode: 'it', countryName: 'Italy' },
  'bastoni': { countryCode: 'it', countryName: 'Italy' },
  'a. bastoni': { countryCode: 'it', countryName: 'Italy' },
  '바스토니': { countryCode: 'it', countryName: 'Italy' },
  'acerbi': { countryCode: 'it', countryName: 'Italy' },
  '아체르비': { countryCode: 'it', countryName: 'Italy' },
  'pavard': { countryCode: 'fr', countryName: 'France' },
  'b. pavard': { countryCode: 'fr', countryName: 'France' },
  '파바르': { countryCode: 'fr', countryName: 'France' },
  'dumfries': { countryCode: 'nl', countryName: 'Netherlands' },
  'd. dumfries': { countryCode: 'nl', countryName: 'Netherlands' },
  '둠프리스': { countryCode: 'nl', countryName: 'Netherlands' },
  'sommer': { countryCode: 'ch', countryName: 'Switzerland' },
  'y. sommer': { countryCode: 'ch', countryName: 'Switzerland' },
  '좀머': { countryCode: 'ch', countryName: 'Switzerland' },

  // AC Milan
  'leao': { countryCode: 'pt', countryName: 'Portugal' },
  'leão': { countryCode: 'pt', countryName: 'Portugal' },
  'r. leao': { countryCode: 'pt', countryName: 'Portugal' },
  '레앙': { countryCode: 'pt', countryName: 'Portugal' },
  '하파엘 레앙': { countryCode: 'pt', countryName: 'Portugal' },
  'morata': { countryCode: 'es', countryName: 'Spain' },
  'a. morata': { countryCode: 'es', countryName: 'Spain' },
  '모라타': { countryCode: 'es', countryName: 'Spain' },
  'pulisic': { countryCode: 'us', countryName: 'USA' },
  'c. pulisic': { countryCode: 'us', countryName: 'USA' },
  '풀리시치': { countryCode: 'us', countryName: 'USA' },
  'reijnders': { countryCode: 'nl', countryName: 'Netherlands' },
  't. reijnders': { countryCode: 'nl', countryName: 'Netherlands' },
  '라인더스': { countryCode: 'nl', countryName: 'Netherlands' },
  'theo hernandez': { countryCode: 'fr', countryName: 'France' },
  't. hernandez': { countryCode: 'fr', countryName: 'France' },
  '테오 에르난데스': { countryCode: 'fr', countryName: 'France' },
  'tomori': { countryCode: 'gb-eng', countryName: 'England' },
  'f. tomori': { countryCode: 'gb-eng', countryName: 'England' },
  '토모리': { countryCode: 'gb-eng', countryName: 'England' },
  'maignan': { countryCode: 'fr', countryName: 'France' },
  'm. maignan': { countryCode: 'fr', countryName: 'France' },
  '메냥': { countryCode: 'fr', countryName: 'France' },

  // Juventus
  'vlahovic': { countryCode: 'rs', countryName: 'Serbia' },
  'vlahović': { countryCode: 'rs', countryName: 'Serbia' },
  'd. vlahovic': { countryCode: 'rs', countryName: 'Serbia' },
  '블라호비치': { countryCode: 'rs', countryName: 'Serbia' },
  'yildiz': { countryCode: 'tr', countryName: 'Turkey' },
  'k. yildiz': { countryCode: 'tr', countryName: 'Turkey' },
  '일디즈': { countryCode: 'tr', countryName: 'Turkey' },
  'koopmeiners': { countryCode: 'nl', countryName: 'Netherlands' },
  't. koopmeiners': { countryCode: 'nl', countryName: 'Netherlands' },
  '코프메이너르스': { countryCode: 'nl', countryName: 'Netherlands' },
  'bremer': { countryCode: 'br', countryName: 'Brazil' },
  '브레메르': { countryCode: 'br', countryName: 'Brazil' },

  // Inter Miami
  'messi': { countryCode: 'ar', countryName: 'Argentina' },
  'l. messi': { countryCode: 'ar', countryName: 'Argentina' },
  'lionel messi': { countryCode: 'ar', countryName: 'Argentina' },
  '메시': { countryCode: 'ar', countryName: 'Argentina' },
  '리오넬 메시': { countryCode: 'ar', countryName: 'Argentina' },
  'suarez': { countryCode: 'uy', countryName: 'Uruguay' },
  'suárez': { countryCode: 'uy', countryName: 'Uruguay' },
  'l. suarez': { countryCode: 'uy', countryName: 'Uruguay' },
  'luis suarez': { countryCode: 'uy', countryName: 'Uruguay' },
  '수아레스': { countryCode: 'uy', countryName: 'Uruguay' },
  '루이스 수아레스': { countryCode: 'uy', countryName: 'Uruguay' },
  'busquets': { countryCode: 'es', countryName: 'Spain' },
  's. busquets': { countryCode: 'es', countryName: 'Spain' },
  '부스케츠': { countryCode: 'es', countryName: 'Spain' },
  'jordi alba': { countryCode: 'es', countryName: 'Spain' },
  'j. alba': { countryCode: 'es', countryName: 'Spain' },
  '알바': { countryCode: 'es', countryName: 'Spain' },
  '조르디 알바': { countryCode: 'es', countryName: 'Spain' },
  'redondo': { countryCode: 'ar', countryName: 'Argentina' },
  'f. redondo': { countryCode: 'ar', countryName: 'Argentina' },
  '레돈도': { countryCode: 'ar', countryName: 'Argentina' },
  'gressel': { countryCode: 'us', countryName: 'USA' },
  'j. gressel': { countryCode: 'us', countryName: 'USA' },
  '그레셀': { countryCode: 'us', countryName: 'USA' },
  'r. taylor': { countryCode: 'fi', countryName: 'Finland' },
  '테일러': { countryCode: 'fi', countryName: 'Finland' },
  'weigandt': { countryCode: 'ar', countryName: 'Argentina' },
  'm. weigandt': { countryCode: 'ar', countryName: 'Argentina' },
  '바이간트': { countryCode: 'ar', countryName: 'Argentina' },
  'aviles': { countryCode: 'ar', countryName: 'Argentina' },
  't. aviles': { countryCode: 'ar', countryName: 'Argentina' },
  '아빌레스': { countryCode: 'ar', countryName: 'Argentina' },
  'd. martinez': { countryCode: 'py', countryName: 'Paraguay' },
  '다비드 마르티네스': { countryCode: 'py', countryName: 'Paraguay' },
  'callender': { countryCode: 'us', countryName: 'USA' },
  'd. callender': { countryCode: 'us', countryName: 'USA' },
  '캘렌더': { countryCode: 'us', countryName: 'USA' },

  // Korea Republic & K-League Stars
  'hyeon-woo jo': { countryCode: 'kr', countryName: 'South Korea' },
  'h. jo': { countryCode: 'kr', countryName: 'South Korea' },
  '조현우': { countryCode: 'kr', countryName: 'South Korea' },
  'young-gwon kim': { countryCode: 'kr', countryName: 'South Korea' },
  'y. kim': { countryCode: 'kr', countryName: 'South Korea' },
  '김영권': { countryCode: 'kr', countryName: 'South Korea' },
  'young-woo seol': { countryCode: 'kr', countryName: 'South Korea' },
  'y. seol': { countryCode: 'kr', countryName: 'South Korea' },
  '설영우': { countryCode: 'kr', countryName: 'South Korea' },
  'myung-jae lee': { countryCode: 'kr', countryName: 'South Korea' },
  'm. lee': { countryCode: 'kr', countryName: 'South Korea' },
  '이명재': { countryCode: 'kr', countryName: 'South Korea' },
  'seung-hyun jung': { countryCode: 'kr', countryName: 'South Korea' },
  's. jung': { countryCode: 'kr', countryName: 'South Korea' },
  '정승현': { countryCode: 'kr', countryName: 'South Korea' },
  'in-beom hwang': { countryCode: 'kr', countryName: 'South Korea' },
  'i. hwang': { countryCode: 'kr', countryName: 'South Korea' },
  '황인범': { countryCode: 'kr', countryName: 'South Korea' },
  'hee-chan hwang': { countryCode: 'kr', countryName: 'South Korea' },
  'h. hwang': { countryCode: 'kr', countryName: 'South Korea' },
  '황희찬': { countryCode: 'kr', countryName: 'South Korea' },
  'jae-sung lee': { countryCode: 'kr', countryName: 'South Korea' },
  'j. lee': { countryCode: 'kr', countryName: 'South Korea' },
  '이재성': { countryCode: 'kr', countryName: 'South Korea' },
  'min-kyu joo': { countryCode: 'kr', countryName: 'South Korea' },
  '주민규': { countryCode: 'kr', countryName: 'South Korea' },
  'gue-sung cho': { countryCode: 'kr', countryName: 'South Korea' },
  '조규성': { countryCode: 'kr', countryName: 'South Korea' },
  'seung-beom ko': { countryCode: 'kr', countryName: 'South Korea' },
  '고승범': { countryCode: 'kr', countryName: 'South Korea' },
  'woo-young jung': { countryCode: 'kr', countryName: 'South Korea' },
  '정우영': { countryCode: 'kr', countryName: 'South Korea' },
  'jin-seob park': { countryCode: 'kr', countryName: 'South Korea' },
  '박진섭': { countryCode: 'kr', countryName: 'South Korea' },
  'jeong-ho hong': { countryCode: 'kr', countryName: 'South Korea' },
  '홍정호': { countryCode: 'kr', countryName: 'South Korea' },
  'tae-hwan kim': { countryCode: 'kr', countryName: 'South Korea' },
  '김태환': { countryCode: 'kr', countryName: 'South Korea' },
  'kook-young han': { countryCode: 'kr', countryName: 'South Korea' },
  '한국영': { countryCode: 'kr', countryName: 'South Korea' },
  'min-kyu song': { countryCode: 'kr', countryName: 'South Korea' },
  '송민규': { countryCode: 'kr', countryName: 'South Korea' },
  'young-wook cho': { countryCode: 'kr', countryName: 'South Korea' },
  '조영욱': { countryCode: 'kr', countryName: 'South Korea' },
  'jun choi': { countryCode: 'kr', countryName: 'South Korea' },
  '최준': { countryCode: 'kr', countryName: 'South Korea' },
  'ju-sung kim': { countryCode: 'kr', countryName: 'South Korea' },
  '김주성': { countryCode: 'kr', countryName: 'South Korea' },
  'sang-woo kang': { countryCode: 'kr', countryName: 'South Korea' },
  '강상우': { countryCode: 'kr', countryName: 'South Korea' },
  'seung-woo lee': { countryCode: 'kr', countryName: 'South Korea' },
  '이승우': { countryCode: 'kr', countryName: 'South Korea' },
  'ki sung-yueng': { countryCode: 'kr', countryName: 'South Korea' },
  '기성용': { countryCode: 'kr', countryName: 'South Korea' },

  // K-League Foreign Stars
  'lingard': { countryCode: 'gb-eng', countryName: 'England' },
  'j. lingard': { countryCode: 'gb-eng', countryName: 'England' },
  '린가드': { countryCode: 'gb-eng', countryName: 'England' },
  '제시 린가드': { countryCode: 'gb-eng', countryName: 'England' },
  'iljutcenko': { countryCode: 'de', countryName: 'Germany' },
  's. iljutcenko': { countryCode: 'de', countryName: 'Germany' },
  '일류첸코': { countryCode: 'de', countryName: 'Germany' },
  'yazan': { countryCode: 'jo', countryName: 'Jordan' },
  'yazan al-arab': { countryCode: 'jo', countryName: 'Jordan' },
  '야잔': { countryCode: 'jo', countryName: 'Jordan' },
  '야잔 알 아랍': { countryCode: 'jo', countryName: 'Jordan' },
  'lucas silva': { countryCode: 'br', countryName: 'Brazil' },
  '루카스 실바': { countryCode: 'br', countryName: 'Brazil' },
  'bojanic': { countryCode: 'se', countryName: 'Sweden' },
  'd. bojanic': { countryCode: 'se', countryName: 'Sweden' },
  '보야니치': { countryCode: 'se', countryName: 'Sweden' },
  'arabidze': { countryCode: 'ge', countryName: 'Georgia' },
  'g. arabidze': { countryCode: 'ge', countryName: 'Georgia' },
  '아라비제': { countryCode: 'ge', countryName: 'Georgia' },
  'ludwigson': { countryCode: 'se', countryName: 'Sweden' },
  'g. ludwigson': { countryCode: 'se', countryName: 'Sweden' },
  '루빅손': { countryCode: 'se', countryName: 'Sweden' },
  'tiago orobo': { countryCode: 'br', countryName: 'Brazil' },
  'tiago': { countryCode: 'br', countryName: 'Brazil' },
  '티아고': { countryCode: 'br', countryName: 'Brazil' },
  'boateng': { countryCode: 'gh', countryName: 'Ghana' },
  'n. boateng': { countryCode: 'gh', countryName: 'Ghana' },
  '보아텡': { countryCode: 'gh', countryName: 'Ghana' },
  'cesinha': { countryCode: 'br', countryName: 'Brazil' },
  '세징야': { countryCode: 'br', countryName: 'Brazil' },
  'wanderson': { countryCode: 'br', countryName: 'Brazil' },
  '완델손': { countryCode: 'br', countryName: 'Brazil' },
  'oberdan': { countryCode: 'br', countryName: 'Brazil' },
  '오베르단': { countryCode: 'br', countryName: 'Brazil' },
  'asani': { countryCode: 'al', countryName: 'Albania' },
  '아사니': { countryCode: 'al', countryName: 'Albania' }
};

// -----------------------------------------------------------------------------
// Strict Korean Surname Validator
// -----------------------------------------------------------------------------
const KOREAN_SURNAMES = new Set([
  '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황',
  '안', '송', '전', '홍', '고', '문', '양', '손', '배', '백', '허', '노', '심', '하', '곽', '성',
  '차', '주', '우', '구', '유', '나', '진', '지', '엄', '채', '원', '천', '방', '공', '함', '설',
  '변', '염', '여', '추', '도', '소', '석', '선', '마', '길', '연', '위', '표', '명', '기', '반',
  '왕', '금', '옥', '육', '인', '맹', '제', '모', '남', '탁', '국', '어', '은', '편', '용', '예',
  '경', '봉'
]);

const TWO_CHAR_KOREAN_SURNAMES = ['황보', '남궁', '제갈', '선우', '독고'];

// Syllables commonly appearing only in foreign transliterations, NEVER native Korean personal names
const FOREIGN_TRANSLITERATION_SYLLABLES = new Set([
  '페', '카', '바', '르', '시', '하', '베', '츠', '디', '아', '스', '살', '리', '워', '커', '놀',
  '드', '메', '시', '라', '야', '올', '모', '야', '말', '귄', '도', '안', '돈', '나', '룸', '마',
  '코', '벨', '그', '리즈', '만', '반', '다', '이', '크', '포', '든', '더', '브', '라', '위', '너'
]);

/**
 * Checks whether a given string is truly an authentic native Korean player name,
 * and NOT a transliterated foreign soccer player.
 */
export function isAuthenticKoreanName(rawName: string): boolean {
  if (!rawName) return false;
  // Extract pure Hangul
  const hangul = rawName.replace(/[^가-힣]/g, '').trim();
  if (hangul.length < 2 || hangul.length > 4) return false;

  // Check known registry first
  const lower = hangul.toLowerCase();
  if (PLAYER_NATIONALITY_REGISTRY[lower] && PLAYER_NATIONALITY_REGISTRY[lower].countryCode !== 'kr') {
    return false;
  }

  // Check 2-letter surname
  for (const twoChar of TWO_CHAR_KOREAN_SURNAMES) {
    if (hangul.startsWith(twoChar) && hangul.length >= 3) {
      return true;
    }
  }

  // Check 1-letter surname
  const firstChar = hangul.charAt(0);
  if (!KOREAN_SURNAMES.has(firstChar)) {
    return false;
  }

  // Exclude names that are clearly foreign transliterations (e.g. 페드리, 가비, 하베르츠, 사카, 라야, 로드리)
  const rest = hangul.slice(1);
  const foreignHits = Array.from(rest).filter(ch => FOREIGN_TRANSLITERATION_SYLLABLES.has(ch)).length;
  if (foreignHits >= 2) {
    return false;
  }

  return true;
}

/**
 * Extracts Korean and English parts from composite names like:
 * "부카요 사카 (B. Saka)" => hangulPart: "부카요 사카", englishPart: "B. Saka"
 */
export function extractPlayerNameParts(rawName: string): { hangulPart: string; englishPart: string; cleanName: string } {
  if (!rawName) return { hangulPart: '', englishPart: '', cleanName: '' };

  let hangulPart = '';
  let englishPart = '';

  const parenMatch = rawName.match(/^(.*?)\((.*?)\)$/);
  if (parenMatch) {
    const p1 = parenMatch[1].trim();
    const p2 = parenMatch[2].trim();
    if (/[가-힣]/.test(p1)) {
      hangulPart = p1;
      englishPart = p2;
    } else {
      englishPart = p1;
      hangulPart = p2;
    }
  } else {
    hangulPart = rawName.replace(/[^가-힣\s]/g, '').trim();
    englishPart = rawName.replace(/[가-힣]/g, '').replace(/[()]/g, '').trim();
  }

  const cleanName = (englishPart || hangulPart || rawName).toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').trim();
  return { hangulPart, englishPart, cleanName };
}

// International National Teams Mapping (국가대표 A매치 전용 단일 진실 소스)
export const NATIONAL_TEAMS_MAP: Record<string, { code: string; name: string }> = {
  // Asia - East & Southeast Asia
  '대한민국': { code: 'kr', name: 'South Korea' },
  '한국': { code: 'kr', name: 'South Korea' },
  'korea': { code: 'kr', name: 'South Korea' },
  'south korea': { code: 'kr', name: 'South Korea' },
  'southkorea': { code: 'kr', name: 'South Korea' },
  'kr': { code: 'kr', name: 'South Korea' },
  '북한': { code: 'kp', name: 'North Korea' },
  '조선': { code: 'kp', name: 'North Korea' },
  'north korea': { code: 'kp', name: 'North Korea' },
  'northkorea': { code: 'kp', name: 'North Korea' },
  'kp': { code: 'kp', name: 'North Korea' },
  '일본': { code: 'jp', name: 'Japan' },
  'japan': { code: 'jp', name: 'Japan' },
  'jp': { code: 'jp', name: 'Japan' },
  '중국': { code: 'cn', name: 'China' },
  'china': { code: 'cn', name: 'China' },
  'cn': { code: 'cn', name: 'China' },
  '몽골': { code: 'mn', name: 'Mongolia' },
  'mongolia': { code: 'mn', name: 'Mongolia' },
  'mn': { code: 'mn', name: 'Mongolia' },
  '대만': { code: 'tw', name: 'Taiwan' },
  '타이완': { code: 'tw', name: 'Taiwan' },
  '차이니즈타이베이': { code: 'tw', name: 'Taiwan' },
  '중화타이베이': { code: 'tw', name: 'Taiwan' },
  'taiwan': { code: 'tw', name: 'Taiwan' },
  'tw': { code: 'tw', name: 'Taiwan' },
  '홍콩': { code: 'hk', name: 'Hong Kong' },
  'hong kong': { code: 'hk', name: 'Hong Kong' },
  'hongkong': { code: 'hk', name: 'Hong Kong' },
  'hk': { code: 'hk', name: 'Hong Kong' },
  '마카오': { code: 'mo', name: 'Macau' },
  'macau': { code: 'mo', name: 'Macau' },
  'mo': { code: 'mo', name: 'Macau' },
  '베트남': { code: 'vn', name: 'Vietnam' },
  'vietnam': { code: 'vn', name: 'Vietnam' },
  'vn': { code: 'vn', name: 'Vietnam' },
  '태국': { code: 'th', name: 'Thailand' },
  'thailand': { code: 'th', name: 'Thailand' },
  'th': { code: 'th', name: 'Thailand' },
  '말레이시아': { code: 'my', name: 'Malaysia' },
  '말레이': { code: 'my', name: 'Malaysia' },
  '말레이시': { code: 'my', name: 'Malaysia' },
  'malaysia': { code: 'my', name: 'Malaysia' },
  'my': { code: 'my', name: 'Malaysia' },
  '인도네시아': { code: 'id', name: 'Indonesia' },
  '인도네': { code: 'id', name: 'Indonesia' },
  '인도네시': { code: 'id', name: 'Indonesia' },
  'indonesia': { code: 'id', name: 'Indonesia' },
  'id': { code: 'id', name: 'Indonesia' },
  '싱가포르': { code: 'sg', name: 'Singapore' },
  '싱가포': { code: 'sg', name: 'Singapore' },
  'singapore': { code: 'sg', name: 'Singapore' },
  'sg': { code: 'sg', name: 'Singapore' },
  '필리핀': { code: 'ph', name: 'Philippines' },
  'philippines': { code: 'ph', name: 'Philippines' },
  'ph': { code: 'ph', name: 'Philippines' },
  '미얀마': { code: 'mm', name: 'Myanmar' },
  '버마': { code: 'mm', name: 'Myanmar' },
  'myanmar': { code: 'mm', name: 'Myanmar' },
  'mm': { code: 'mm', name: 'Myanmar' },
  '캄보디아': { code: 'kh', name: 'Cambodia' },
  '캄보디': { code: 'kh', name: 'Cambodia' },
  'cambodia': { code: 'kh', name: 'Cambodia' },
  'kh': { code: 'kh', name: 'Cambodia' },
  '라오스': { code: 'la', name: 'Laos' },
  'laos': { code: 'la', name: 'Laos' },
  'la': { code: 'la', name: 'Laos' },
  '브루나이': { code: 'bn', name: 'Brunei' },
  '브루나': { code: 'bn', name: 'Brunei' },
  'brunei': { code: 'bn', name: 'Brunei' },
  'bn': { code: 'bn', name: 'Brunei' },
  '동티모르': { code: 'tl', name: 'Timor-Leste' },
  '티모르': { code: 'tl', name: 'Timor-Leste' },
  'timor-leste': { code: 'tl', name: 'Timor-Leste' },
  'tl': { code: 'tl', name: 'Timor-Leste' },

  // Asia - Central & South Asia
  '카자흐스탄': { code: 'kz', name: 'Kazakhstan' },
  '카자흐': { code: 'kz', name: 'Kazakhstan' },
  '카자흐스': { code: 'kz', name: 'Kazakhstan' },
  'kazakhstan': { code: 'kz', name: 'Kazakhstan' },
  'kz': { code: 'kz', name: 'Kazakhstan' },
  '키르기스스탄': { code: 'kg', name: 'Kyrgyzstan' },
  '키르기스': { code: 'kg', name: 'Kyrgyzstan' },
  '키르기즈': { code: 'kg', name: 'Kyrgyzstan' },
  '키르기즈스탄': { code: 'kg', name: 'Kyrgyzstan' },
  '키르기': { code: 'kg', name: 'Kyrgyzstan' },
  'kyrgyzstan': { code: 'kg', name: 'Kyrgyzstan' },
  'kg': { code: 'kg', name: 'Kyrgyzstan' },
  '타지키스탄': { code: 'tj', name: 'Tajikistan' },
  '타지키': { code: 'tj', name: 'Tajikistan' },
  '타지크': { code: 'tj', name: 'Tajikistan' },
  'tajikistan': { code: 'tj', name: 'Tajikistan' },
  'tj': { code: 'tj', name: 'Tajikistan' },
  '투르크메니스탄': { code: 'tm', name: 'Turkmenistan' },
  '투르크메': { code: 'tm', name: 'Turkmenistan' },
  '투르크': { code: 'tm', name: 'Turkmenistan' },
  'turkmenistan': { code: 'tm', name: 'Turkmenistan' },
  'tm': { code: 'tm', name: 'Turkmenistan' },
  '우즈베키스탄': { code: 'uz', name: 'Uzbekistan' },
  '우즈벡': { code: 'uz', name: 'Uzbekistan' },
  '우즈베키': { code: 'uz', name: 'Uzbekistan' },
  'uzbekistan': { code: 'uz', name: 'Uzbekistan' },
  'uz': { code: 'uz', name: 'Uzbekistan' },
  '네팔': { code: 'np', name: 'Nepal' },
  'nepal': { code: 'np', name: 'Nepal' },
  'np': { code: 'np', name: 'Nepal' },
  '인도': { code: 'in', name: 'India' },
  'india': { code: 'in', name: 'India' },
  'in': { code: 'in', name: 'India' },
  '파키스탄': { code: 'pk', name: 'Pakistan' },
  'pakistan': { code: 'pk', name: 'Pakistan' },
  'pk': { code: 'pk', name: 'Pakistan' },
  '방글라데시': { code: 'bd', name: 'Bangladesh' },
  '방글라': { code: 'bd', name: 'Bangladesh' },
  'bangladesh': { code: 'bd', name: 'Bangladesh' },
  'bd': { code: 'bd', name: 'Bangladesh' },
  '스리랑카': { code: 'lk', name: 'Sri Lanka' },
  '스리랑': { code: 'lk', name: 'Sri Lanka' },
  'sri lanka': { code: 'lk', name: 'Sri Lanka' },
  'lk': { code: 'lk', name: 'Sri Lanka' },
  '몰디브': { code: 'mv', name: 'Maldives' },
  'maldives': { code: 'mv', name: 'Maldives' },
  'mv': { code: 'mv', name: 'Maldives' },
  '부탄': { code: 'bt', name: 'Bhutan' },
  'bhutan': { code: 'bt', name: 'Bhutan' },
  'bt': { code: 'bt', name: 'Bhutan' },
  '아프가니스탄': { code: 'af', name: 'Afghanistan' },
  '아프간': { code: 'af', name: 'Afghanistan' },
  'afghanistan': { code: 'af', name: 'Afghanistan' },
  'af': { code: 'af', name: 'Afghanistan' },

  // Asia - West Asia / Middle East
  '이란': { code: 'ir', name: 'Iran' },
  'iran': { code: 'ir', name: 'Iran' },
  'ir': { code: 'ir', name: 'Iran' },
  '이라크': { code: 'iq', name: 'Iraq' },
  'iraq': { code: 'iq', name: 'Iraq' },
  'iq': { code: 'iq', name: 'Iraq' },
  '사우디': { code: 'sa', name: 'Saudi Arabia' },
  '사우디아라비아': { code: 'sa', name: 'Saudi Arabia' },
  'saudi arabia': { code: 'sa', name: 'Saudi Arabia' },
  'saudi': { code: 'sa', name: 'Saudi Arabia' },
  'sa': { code: 'sa', name: 'Saudi Arabia' },
  '카타르': { code: 'qa', name: 'Qatar' },
  'qatar': { code: 'qa', name: 'Qatar' },
  'qa': { code: 'qa', name: 'Qatar' },
  '아랍에미리트': { code: 'ae', name: 'United Arab Emirates' },
  '아랍에미': { code: 'ae', name: 'United Arab Emirates' },
  'uae': { code: 'ae', name: 'United Arab Emirates' },
  'ae': { code: 'ae', name: 'United Arab Emirates' },
  '요르단': { code: 'jo', name: 'Jordan' },
  'jordan': { code: 'jo', name: 'Jordan' },
  'jo': { code: 'jo', name: 'Jordan' },
  '오만': { code: 'om', name: 'Oman' },
  'oman': { code: 'om', name: 'Oman' },
  'om': { code: 'om', name: 'Oman' },
  '바레인': { code: 'bh', name: 'Bahrain' },
  'bahrain': { code: 'bh', name: 'Bahrain' },
  'bh': { code: 'bh', name: 'Bahrain' },
  '쿠웨이트': { code: 'kw', name: 'Kuwait' },
  'kuwait': { code: 'kw', name: 'Kuwait' },
  'kw': { code: 'kw', name: 'Kuwait' },
  '시리아': { code: 'sy', name: 'Syria' },
  'syria': { code: 'sy', name: 'Syria' },
  'sy': { code: 'sy', name: 'Syria' },
  '레바논': { code: 'lb', name: 'Lebanon' },
  'lebanon': { code: 'lb', name: 'Lebanon' },
  'lb': { code: 'lb', name: 'Lebanon' },
  '팔레스타인': { code: 'ps', name: 'Palestine' },
  '팔레스타': { code: 'ps', name: 'Palestine' },
  'palestine': { code: 'ps', name: 'Palestine' },
  'ps': { code: 'ps', name: 'Palestine' },
  '예멘': { code: 'ye', name: 'Yemen' },
  'yemen': { code: 'ye', name: 'Yemen' },
  'ye': { code: 'ye', name: 'Yemen' },

  // Oceania
  '호주': { code: 'au', name: 'Australia' },
  'australia': { code: 'au', name: 'Australia' },
  '오스트레일리아': { code: 'au', name: 'Australia' },
  'au': { code: 'au', name: 'Australia' },
  '뉴질랜드': { code: 'nz', name: 'New Zealand' },
  '뉴질랜': { code: 'nz', name: 'New Zealand' },
  'new zealand': { code: 'nz', name: 'New Zealand' },
  'nz': { code: 'nz', name: 'New Zealand' },
  '괌': { code: 'gu', name: 'Guam' },
  'guam': { code: 'gu', name: 'Guam' },
  'gu': { code: 'gu', name: 'Guam' },

  // South America
  '브라질': { code: 'br', name: 'Brazil' },
  'brazil': { code: 'br', name: 'Brazil' },
  'br': { code: 'br', name: 'Brazil' },
  '아르헨티나': { code: 'ar', name: 'Argentina' },
  'argentina': { code: 'ar', name: 'Argentina' },
  'ar': { code: 'ar', name: 'Argentina' },
  '우루과이': { code: 'uy', name: 'Uruguay' },
  'uruguay': { code: 'uy', name: 'Uruguay' },
  'uy': { code: 'uy', name: 'Uruguay' },
  '콜롬비아': { code: 'co', name: 'Colombia' },
  'colombia': { code: 'co', name: 'Colombia' },
  'co': { code: 'co', name: 'Colombia' },
  '칠레': { code: 'cl', name: 'Chile' },
  'chile': { code: 'cl', name: 'Chile' },
  'cl': { code: 'cl', name: 'Chile' },
  '에콰도르': { code: 'ec', name: 'Ecuador' },
  'ecuador': { code: 'ec', name: 'Ecuador' },
  'ec': { code: 'ec', name: 'Ecuador' },
  '파라과이': { code: 'py', name: 'Paraguay' },
  'paraguay': { code: 'py', name: 'Paraguay' },
  'py': { code: 'py', name: 'Paraguay' },
  '페루': { code: 'pe', name: 'Peru' },
  'peru': { code: 'pe', name: 'Peru' },
  'pe': { code: 'pe', name: 'Peru' },
  '베네수엘라': { code: 've', name: 'Venezuela' },
  'venezuela': { code: 've', name: 'Venezuela' },
  've': { code: 've', name: 'Venezuela' },
  '볼리비아': { code: 'bo', name: 'Bolivia' },
  'bolivia': { code: 'bo', name: 'Bolivia' },
  'bo': { code: 'bo', name: 'Bolivia' },

  // Europe
  '프랑스': { code: 'fr', name: 'France' },
  'france': { code: 'fr', name: 'France' },
  'fr': { code: 'fr', name: 'France' },
  '독일': { code: 'de', name: 'Germany' },
  'germany': { code: 'de', name: 'Germany' },
  'de': { code: 'de', name: 'Germany' },
  '잉글랜드': { code: 'gb-eng', name: 'England' },
  'england': { code: 'gb-eng', name: 'England' },
  '스페인': { code: 'es', name: 'Spain' },
  'spain': { code: 'es', name: 'Spain' },
  'es': { code: 'es', name: 'Spain' },
  '이탈리아': { code: 'it', name: 'Italy' },
  'italy': { code: 'it', name: 'Italy' },
  'it': { code: 'it', name: 'Italy' },
  '포르투갈': { code: 'pt', name: 'Portugal' },
  'portugal': { code: 'pt', name: 'Portugal' },
  'pt': { code: 'pt', name: 'Portugal' },
  '네덜란드': { code: 'nl', name: 'Netherlands' },
  'netherlands': { code: 'nl', name: 'Netherlands' },
  'nl': { code: 'nl', name: 'Netherlands' },
  '벨기에': { code: 'be', name: 'Belgium' },
  'belgium': { code: 'be', name: 'Belgium' },
  'be': { code: 'be', name: 'Belgium' },
  '크로아티아': { code: 'hr', name: 'Croatia' },
  'croatia': { code: 'hr', name: 'Croatia' },
  'hr': { code: 'hr', name: 'Croatia' },
  '스위스': { code: 'ch', name: 'Switzerland' },
  'switzerland': { code: 'ch', name: 'Switzerland' },
  'ch': { code: 'ch', name: 'Switzerland' },
  '오스트리아': { code: 'at', name: 'Austria' },
  'austria': { code: 'at', name: 'Austria' },
  'at': { code: 'at', name: 'Austria' },
  '덴마크': { code: 'dk', name: 'Denmark' },
  'denmark': { code: 'dk', name: 'Denmark' },
  'dk': { code: 'dk', name: 'Denmark' },
  '스웨덴': { code: 'se', name: 'Sweden' },
  'sweden': { code: 'se', name: 'Sweden' },
  'se': { code: 'se', name: 'Sweden' },
  '노르웨이': { code: 'no', name: 'Norway' },
  'norway': { code: 'no', name: 'Norway' },
  'no': { code: 'no', name: 'Norway' },
  '폴란드': { code: 'pl', name: 'Poland' },
  'poland': { code: 'pl', name: 'Poland' },
  'pl': { code: 'pl', name: 'Poland' },
  '튀르키예': { code: 'tr', name: 'Turkey' },
  '터키': { code: 'tr', name: 'Turkey' },
  'turkey': { code: 'tr', name: 'Turkey' },
  'tr': { code: 'tr', name: 'Turkey' },
  '세르비아': { code: 'rs', name: 'Serbia' },
  'serbia': { code: 'rs', name: 'Serbia' },
  'rs': { code: 'rs', name: 'Serbia' },
  '체코': { code: 'cz', name: 'Czech Republic' },
  'czech': { code: 'cz', name: 'Czech Republic' },
  'cz': { code: 'cz', name: 'Czech Republic' },
  '슬로바키아': { code: 'sk', name: 'Slovakia' },
  'slovakia': { code: 'sk', name: 'Slovakia' },
  'sk': { code: 'sk', name: 'Slovakia' },
  '슬로베니아': { code: 'si', name: 'Slovenia' },
  'slovenia': { code: 'si', name: 'Slovenia' },
  'si': { code: 'si', name: 'Slovenia' },
  '헝가리': { code: 'hu', name: 'Hungary' },
  'hungary': { code: 'hu', name: 'Hungary' },
  'hu': { code: 'hu', name: 'Hungary' },
  '루마니아': { code: 'ro', name: 'Romania' },
  'romania': { code: 'ro', name: 'Romania' },
  'ro': { code: 'ro', name: 'Romania' },
  '스코틀랜드': { code: 'gb-sct', name: 'Scotland' },
  'scotland': { code: 'gb-sct', name: 'Scotland' },
  '웨일스': { code: 'gb-wls', name: 'Wales' },
  'wales': { code: 'gb-wls', name: 'Wales' },
  '북아일랜드': { code: 'gb-nir', name: 'Northern Ireland' },
  '아일랜드': { code: 'ie', name: 'Ireland' },
  'ireland': { code: 'ie', name: 'Ireland' },
  'ie': { code: 'ie', name: 'Ireland' },
  '그리스': { code: 'gr', name: 'Greece' },
  'greece': { code: 'gr', name: 'Greece' },
  'gr': { code: 'gr', name: 'Greece' },
  '조지아': { code: 'ge', name: 'Georgia' },
  'georgia': { code: 'ge', name: 'Georgia' },
  'ge': { code: 'ge', name: 'Georgia' },
  '우크라이나': { code: 'ua', name: 'Ukraine' },
  'ukraine': { code: 'ua', name: 'Ukraine' },
  'ua': { code: 'ua', name: 'Ukraine' },
  '핀란드': { code: 'fi', name: 'Finland' },
  'finland': { code: 'fi', name: 'Finland' },
  'fi': { code: 'fi', name: 'Finland' },
  '아이슬란드': { code: 'is', name: 'Iceland' },
  '알바니아': { code: 'al', name: 'Albania' },
  '북마케도니아': { code: 'mk', name: 'North Macedonia' },
  '마케도니아': { code: 'mk', name: 'North Macedonia' },
  '몬테네그로': { code: 'me', name: 'Montenegro' },
  '보스니아': { code: 'ba', name: 'Bosnia and Herzegovina' },
  '코소보': { code: 'xk', name: 'Kosovo' },
  '불가리아': { code: 'bg', name: 'Bulgaria' },
  '벨라루스': { code: 'by', name: 'Belarus' },
  '룩셈부르크': { code: 'lu', name: 'Luxembourg' },
  '키프로스': { code: 'cy', name: 'Cyprus' },
  '에스토니아': { code: 'ee', name: 'Estonia' },
  '라트비아': { code: 'lv', name: 'Latvia' },
  '리투아니아': { code: 'lt', name: 'Lithuania' },
  '몰도바': { code: 'md', name: 'Moldova' },
  '아르메니아': { code: 'am', name: 'Armenia' },
  '아제르바이잔': { code: 'az', name: 'Azerbaijan' },
  '페로제도': { code: 'fo', name: 'Faroe Islands' },
  '몰타': { code: 'mt', name: 'Malta' },
  '안도라': { code: 'ad', name: 'Andorra' },
  '산마리노': { code: 'sm', name: 'San Marino' },
  '지브롤터': { code: 'gi', name: 'Gibraltar' },
  '리히텐슈타인': { code: 'li', name: 'Liechtenstein' },

  // North & Central America
  '미국': { code: 'us', name: 'USA' },
  'usa': { code: 'us', name: 'USA' },
  'us': { code: 'us', name: 'USA' },
  '멕시코': { code: 'mx', name: 'Mexico' },
  'mexico': { code: 'mx', name: 'Mexico' },
  'mx': { code: 'mx', name: 'Mexico' },
  '캐나다': { code: 'ca', name: 'Canada' },
  'canada': { code: 'ca', name: 'Canada' },
  'ca': { code: 'ca', name: 'Canada' },
  '코스타리카': { code: 'cr', name: 'Costa Rica' },
  'costa rica': { code: 'cr', name: 'Costa Rica' },
  'cr': { code: 'cr', name: 'Costa Rica' },
  '파나마': { code: 'pa', name: 'Panama' },
  '자메이카': { code: 'jm', name: 'Jamaica' },
  '온두라스': { code: 'hn', name: 'Honduras' },
  '엘살바도르': { code: 'sv', name: 'El Salvador' },
  '과테말라': { code: 'gt', name: 'Guatemala' },

  // Africa
  '모로코': { code: 'ma', name: 'Morocco' },
  'morocco': { code: 'ma', name: 'Morocco' },
  'ma': { code: 'ma', name: 'Morocco' },
  '세네갈': { code: 'sn', name: 'Senegal' },
  'senegal': { code: 'sn', name: 'Senegal' },
  'sn': { code: 'sn', name: 'Senegal' },
  '이집트': { code: 'eg', name: 'Egypt' },
  'egypt': { code: 'eg', name: 'Egypt' },
  'eg': { code: 'eg', name: 'Egypt' },
  '나이지리아': { code: 'ng', name: 'Nigeria' },
  'nigeria': { code: 'ng', name: 'Nigeria' },
  'ng': { code: 'ng', name: 'Nigeria' },
  '알제리': { code: 'dz', name: 'Algeria' },
  'algeria': { code: 'dz', name: 'Algeria' },
  'dz': { code: 'dz', name: 'Algeria' },
  '가나': { code: 'gh', name: 'Ghana' },
  'ghana': { code: 'gh', name: 'Ghana' },
  'gh': { code: 'gh', name: 'Ghana' },
  '코트디부아르': { code: 'ci', name: 'Ivory Coast' },
  '카메룬': { code: 'cm', name: 'Cameroon' },
  '남아공': { code: 'za', name: 'South Africa' },
  '남아프리카공화국': { code: 'za', name: 'South Africa' },
  '튀니지': { code: 'tn', name: 'Tunisia' },
  '말리': { code: 'ml', name: 'Mali' },
  '콩고': { code: 'cd', name: 'DR Congo' },
  '부르키나파소': { code: 'bf', name: 'Burkina Faso' },
  '기니': { code: 'gn', name: 'Guinea' }
};

/**
 * Checks if a team is a recognized national team and returns its country metadata.
 * Strips bracketed indicators like (국), [국], (A), (U23), [홈], [원정], etc.
 */
export function getNationalTeamInfo(teamName?: string): { countryCode: string; countryName: string } | null {
  if (!teamName) return null;

  // 1. Remove bracketed notations and special symbols
  let clean = teamName
    .replace(/[\(\[\{](?:국|a|u23|u20|u17|홈|원정|h|away|home)[\)\]\}]/gi, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

  // 2. Remove common national team suffixes
  const suffixes = ['국가대표팀', '축구대표팀', '대표팀', '국가대표', '축구단', '대표', 'a대표', 'a'];
  for (const suf of suffixes) {
    if (clean.endsWith(suf) && clean.length > suf.length) {
      clean = clean.slice(0, -suf.length);
      break;
    }
  }

  // 3. Direct dictionary check
  if (NATIONAL_TEAMS_MAP[clean]) {
    return { countryCode: NATIONAL_TEAMS_MAP[clean].code, countryName: NATIONAL_TEAMS_MAP[clean].name };
  }

  // 4. Exact check in COUNTRY_CODE_MAP (handles upper/lower case 2-letter / 3-letter codes & names)
  const upperKey = clean.toUpperCase();
  if (COUNTRY_CODE_MAP[upperKey]) {
    return { countryCode: COUNTRY_CODE_MAP[upperKey].code, countryName: COUNTRY_CODE_MAP[upperKey].name };
  }

  // 5. Check against keys in NATIONAL_TEAMS_MAP
  for (const [key, val] of Object.entries(NATIONAL_TEAMS_MAP)) {
    const kClean = key.toLowerCase().replace(/\s+/g, '');
    if (clean === kClean) {
      return { countryCode: val.code, countryName: val.name };
    }
  }

  // 6. Substring check for exact team name matching (excluding club names)
  const isClub = clean.includes('fc') || clean.includes('시티') || clean.includes('유나이티드') || 
                 clean.includes('클럽') || clean.includes('sc') || clean.includes('cf') || 
                 clean.includes('타운') || clean.includes('로버스') || clean.includes('스틸러스') || 
                 clean.includes('현대') || clean.includes('상무') || clean.includes('유니온');
  
  if (!isClub) {
    // Sort keys by length descending to match longest specific country token first (e.g. "카자흐스탄" before "카자흐")
    const sortedKeys = Object.keys(NATIONAL_TEAMS_MAP).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const kClean = key.toLowerCase().replace(/\s+/g, '');
      if (kClean.length >= 2 && clean.includes(kClean)) {
        const val = NATIONAL_TEAMS_MAP[key];
        return { countryCode: val.code, countryName: val.name };
      }
    }
  }

  return null;
}

/**
 * Systematically resolves the country code and name for any soccer player.
 */
export function resolvePlayerCountry(
  rawCountryCode?: string,
  rawCountryName?: string,
  playerName?: string,
  teamContext?: string
): PlayerNationality {
  // 0. CRITICAL: National Team Match (국제경기 / 국가대표 A매치)
  // In international matches, ALL players representing a national team MUST share that nation's nationality.
  // This guarantees that Japan players NEVER get English/Korean flags, Australia players get AU, Brazil get BR, etc.
  const natTeamInfo = getNationalTeamInfo(teamContext);
  if (natTeamInfo) {
    return { countryCode: natTeamInfo.countryCode, countryName: natTeamInfo.countryName };
  }

  // 1. Direct country code / name match from input parameters
  if (rawCountryCode || rawCountryName) {
    const key = (rawCountryCode || rawCountryName || '').trim().toUpperCase();
    if (COUNTRY_CODE_MAP[key]) {
      return {
        countryCode: COUNTRY_CODE_MAP[key].code,
        countryName: COUNTRY_CODE_MAP[key].name
      };
    }
    // If standard 2-letter code, lowercase it
    if (rawCountryCode && rawCountryCode.trim().length === 2) {
      const code = rawCountryCode.trim().toLowerCase();
      return {
        countryCode: code,
        countryName: rawCountryName || rawCountryCode.toUpperCase()
      };
    }
  }

  // 2. Lookup by player name (both English & Korean parts)
  if (playerName) {
    const { hangulPart, englishPart } = extractPlayerNameParts(playerName);

    const candidates = [
      playerName.toLowerCase().trim(),
      englishPart.toLowerCase().trim(),
      hangulPart.toLowerCase().trim(),
      // Last name only of englishPart (e.g. "B. Saka" -> "saka")
      englishPart.split(/\s+/).pop()?.toLowerCase() || '',
      // Last name of hangulPart
      hangulPart.split(/\s+/).pop()?.toLowerCase() || ''
    ].filter(Boolean);

    for (const cand of candidates) {
      if (PLAYER_NATIONALITY_REGISTRY[cand]) {
        return PLAYER_NATIONALITY_REGISTRY[cand];
      }
    }

    // Check partial containment in registry
    for (const [key, nat] of Object.entries(PLAYER_NATIONALITY_REGISTRY)) {
      if (candidates.some(c => c.length >= 3 && (c === key || c.includes(key) || key.includes(c)))) {
        return nat;
      }
    }

    // 3. Strict Authentic Korean Check
    if (isAuthenticKoreanName(hangulPart || playerName)) {
      return { countryCode: 'kr', countryName: 'South Korea' };
    }
  }

  // 4. Team Context Fallback (Prevents foreign clubs from receiving KR flags)
  if (teamContext) {
    const normTeam = teamContext.toLowerCase().replace(/\s+/g, '');
    if (normTeam.includes('울산') || normTeam.includes('전북') || normTeam.includes('서울') || normTeam.includes('포항') || normTeam.includes('김천') || normTeam.includes('광주') || normTeam.includes('강원') || normTeam.includes('인천') || normTeam.includes('대구') || normTeam.includes('수원') || normTeam.includes('대한민국') || normTeam.includes('한국')) {
      return { countryCode: 'kr', countryName: 'South Korea' };
    }
    if (normTeam.includes('마드리드') || normTeam.includes('바르셀로나') || normTeam.includes('바르샤') || normTeam.includes('라리가') || normTeam.includes('비야레알') || normTeam.includes('베티스') || normTeam.includes('세비야') || normTeam.includes('발렌시아') || normTeam.includes('소시에다')) {
      return { countryCode: 'es', countryName: 'Spain' };
    }
    if (normTeam.includes('맨체스터') || normTeam.includes('맨시티') || normTeam.includes('맨유') || normTeam.includes('아스널') || normTeam.includes('리버풀') || normTeam.includes('첼시') || normTeam.includes('토트넘') || normTeam.includes('뉴캐슬') || normTeam.includes('빌라') || normTeam.includes('epl')) {
      return { countryCode: 'gb-eng', countryName: 'England' };
    }
    if (normTeam.includes('뮌헨') || normTeam.includes('바이에른') || normTeam.includes('도르트문트') || normTeam.includes('레버쿠젠') || normTeam.includes('라이프치히') || normTeam.includes('분데스')) {
      return { countryCode: 'de', countryName: 'Germany' };
    }
    if (normTeam.includes('밀란') || normTeam.includes('인테르') || normTeam.includes('유벤투스') || normTeam.includes('나폴리') || normTeam.includes('로마') || normTeam.includes('세리에')) {
      return { countryCode: 'it', countryName: 'Italy' };
    }
    if (normTeam.includes('파리') || normTeam.includes('psg') || normTeam.includes('마르세유') || normTeam.includes('모나코') || normTeam.includes('리그1')) {
      return { countryCode: 'fr', countryName: 'France' };
    }
    if (normTeam.includes('마이애미') || normTeam.includes('mls') || normTeam.includes('갤럭시') || normTeam.includes('lafc') || normTeam.includes('사운더스') || normTeam.includes('샌디에이고') || normTeam.includes('필라델피아') || normTeam.includes('크루') || normTeam.includes('레드불스')) {
      return { countryCode: 'us', countryName: 'USA' };
    }
    if (normTeam.includes('가와사키') || normTeam.includes('요코하마') || normTeam.includes('우라와') || normTeam.includes('고베') || normTeam.includes('나고야') || normTeam.includes('산프레체') || normTeam.includes('감바') || normTeam.includes('세레소') || normTeam.includes('가시마') || normTeam.includes('fc도쿄') || normTeam.includes('j리그') || normTeam.includes('j1')) {
      return { countryCode: 'jp', countryName: 'Japan' };
    }
    if (normTeam.includes('시드니') || normTeam.includes('멜버른') || normTeam.includes('브리즈번') || normTeam.includes('애들레이드') || normTeam.includes('센트럴코스트') || normTeam.includes('a리그')) {
      return { countryCode: 'au', countryName: 'Australia' };
    }
    if (normTeam.includes('알힐랄') || normTeam.includes('알나스르') || normTeam.includes('알이티하드') || normTeam.includes('알아흘리')) {
      return { countryCode: 'sa', countryName: 'Saudi Arabia' };
    }
    if (normTeam.includes('아약스') || normTeam.includes('페예노르트') || normTeam.includes('psv') || normTeam.includes('에레디비시')) {
      return { countryCode: 'nl', countryName: 'Netherlands' };
    }
    if (normTeam.includes('벤피카') || normTeam.includes('스포르팅') || normTeam.includes('포르투') || normTeam.includes('포르투갈')) {
      return { countryCode: 'pt', countryName: 'Portugal' };
    }
  }

  // Default fallback (null-safe)
  return { countryCode: 'gb-eng', countryName: 'England' };
}

/**
 * Returns flagcdn.com URL for any country code.
 */
export function getCountryFlagUrl(
  countryCode?: string,
  countryName?: string,
  playerName?: string,
  teamContext?: string
): string | null {
  const resolved = resolvePlayerCountry(countryCode, countryName, playerName, teamContext);
  if (resolved && resolved.countryCode) {
    return `https://flagcdn.com/w40/${resolved.countryCode.toLowerCase()}.png`;
  }
  return null;
}
