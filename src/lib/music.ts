/** Thư viện local (đã lọc) + playlist thịnh hành YouTube */
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: string;
}

export interface MusicPlaylist {
  id: string;
  title: string;
  description: string;
  region: "vn" | "global" | "mix";
}

/** Playlist công khai trên YouTube — “nhạc nổi” theo chủ đề */
export const TRENDING_PLAYLISTS: MusicPlaylist[] = [
  {
    id: "PL4fGSI1pDJn6jXS_Tv_N9B-ZFh_EYCkzp",
    title: "YouTube Music · Top Songs Global",
    description: "Bảng xếp hạng toàn cầu (YouTube Music)",
    region: "global",
  },
  {
    id: "PL4fGSI1pDJn6pu3C8yZcW9a4a5n3X5p0K",
    title: "Top Songs · Vietnam (tham khảo)",
    description: "Nhạc Việt / khu vực — có thể đổi theo thời điểm",
    region: "vn",
  },
  {
    id: "PLrAXtmRdnEQy6nuLMvq0o8b8b8b8b8b8b",
    title: "Placeholder skip",
    description: "",
    region: "mix",
  },
];

// Real known public playlist / radio style video IDs used as “channels”
export const LIVE_RADIOS = [
  { id: "jfKfPfyJRdk", title: "Lofi Hip Hop Radio — relax/study", artist: "Lofi Girl", category: "Lofi" },
  { id: "5qap5aO4i9A", title: "Lofi beats to relax/study to", artist: "Lofi Girl", category: "Lofi" },
  { id: "4xDzrJKXOOY", title: "Synthwave Radio — chill/game", artist: "Lofi Girl", category: "Lofi" },
  { id: "5yx6BWlEVcY", title: "Chillhop Radio — jazzy & lofi", artist: "Chillhop Music", category: "Lofi" },
  { id: "lTRiuFIWV54", title: "1 A.M Study Session — lofi", artist: "Lofi Girl", category: "Lofi" },
  { id: "DWcJFNfaw9c", title: "Lofi Radio — sleep/chill", artist: "Lofi Girl", category: "Lofi" },
  { id: "n61ULEU7CO0", title: "Best of lofi hip hop 2021", artist: "Lofi Girl", category: "Lofi" },
];

export const MUSIC_CATEGORIES = [
  "Tất cả",
  "V-Pop",
  "EDM",
  "Trend",
  "Ballad",
  "K-Pop",
  "US-UK",
  "Lofi",
  "Remix",
];

/** Danh sách MV đã kiểm tra oEmbed — bổ sung dần */
export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "qsyshtf0nqI", title: "Lạc Trôi", artist: "Sơn Tùng M-TP", category: "V-Pop" },
  { id: "pJHQmhJXZ6Y", title: "Hãy Trao Cho Anh", artist: "Sơn Tùng M-TP", category: "V-Pop" },
  { id: "D8rRqezRZF8", title: "See Tình", artist: "Hoàng Thùy Linh", category: "V-Pop" },
  { id: "luoyJQQzA8s", title: "Đưa Nhau Đi Trốn", artist: "Đen Vâu", category: "V-Pop" },
  { id: "E7nBqF1q3FQ", title: "Nấu Ăn Cho Em", artist: "Đen Vâu", category: "V-Pop" },
  { id: "Y5tqK1hY9fY", title: "Ánh Nắng Của Anh", artist: "Đức Phúc", category: "Ballad" },
  { id: "gJAbDSse5WM", title: "Tìm em ft. Bảo Anh", artist: "Hngle", category: "V-Pop" },
  { id: "9UcQ7ddVjoc", title: "KHÔNG BUÔNG ft. Ari", artist: "Hngle", category: "V-Pop" },
  { id: "WqVkuJehQ4w", title: "Buông", artist: "Hngle", category: "V-Pop" },
  { id: "n61ULEU7CO0", title: "Best of lofi hip hop 2021", artist: "Lofi Girl", category: "Lofi" },
  { id: "FN7ALfpGxiI", title: "Nơi Này Có Anh", artist: "Sơn Tùng M-TP", category: "V-Pop" },
  { id: "gdZLi9oWNZg", title: "Dynamite", artist: "BTS", category: "K-Pop" },
  { id: "kTlv5_Bs8aw", title: "MIC Drop (Steve Aoki Remix)", artist: "BTS", category: "K-Pop" },
  { id: "POe9SOEKotk", title: "Shut Down", artist: "BLACKPINK", category: "K-Pop" },
  { id: "Amq-qlqbjYA", title: "AS IF IT'S YOUR LAST", artist: "BLACKPINK", category: "K-Pop" },
  { id: "9bZkp7q19f0", title: "GANGNAM STYLE", artist: "PSY", category: "Trend" },
  { id: "60ItHLz5WEA", title: "Faded", artist: "Alan Walker", category: "EDM" },
  { id: "IcrbM1l_BoI", title: "Wake Me Up", artist: "Avicii", category: "EDM" },
  { id: "7wtfhZwyrcc", title: "Believer", artist: "Imagine Dragons", category: "EDM" },
  { id: "ktvTqknDobU", title: "Radioactive", artist: "Imagine Dragons", category: "US-UK" },
  { id: "YQHsXMglC9A", title: "Hello", artist: "Adele", category: "Ballad" },
  { id: "hLQl3WQQoQ0", title: "Someone Like You", artist: "Adele", category: "Ballad" },
  { id: "rYEDA3JcQqw", title: "Rolling in the Deep", artist: "Adele", category: "Ballad" },
  { id: "2Vv-BfVoq4g", title: "Perfect", artist: "Ed Sheeran", category: "Ballad" },
  { id: "JGwWNGJdvx8", title: "Shape of You", artist: "Ed Sheeran", category: "US-UK" },
  { id: "lp-EO5I60KA", title: "Thinking Out Loud", artist: "Ed Sheeran", category: "Ballad" },
  { id: "450p7goxZqg", title: "All of Me", artist: "John Legend", category: "Ballad" },
  { id: "3JWTaaS7LdU", title: "I Will Always Love You", artist: "Whitney Houston", category: "Ballad" },
  { id: "kJQP7kiw5Fk", title: "Despacito", artist: "Luis Fonsi", category: "US-UK" },
  { id: "RgKAFK5djSk", title: "See You Again", artist: "Wiz Khalifa ft. Charlie Puth", category: "US-UK" },
  { id: "hT_nvWreIhg", title: "Counting Stars", artist: "OneRepublic", category: "US-UK" },
  { id: "09R8_2nJtjg", title: "Sugar", artist: "Maroon 5", category: "US-UK" },
  { id: "e-ORhEE9VVg", title: "Blank Space", artist: "Taylor Swift", category: "US-UK" },
  { id: "8xg3vE8Ie_E", title: "Love Story", artist: "Taylor Swift", category: "US-UK" },
  { id: "3tmd-ClpJxA", title: "Look What You Made Me Do", artist: "Taylor Swift", category: "Trend" },
  { id: "4NRXx6U8ABQ", title: "Blinding Lights", artist: "The Weeknd", category: "Trend" },
  { id: "DyDfgMOUjCI", title: "bad guy", artist: "Billie Eilish", category: "Trend" },
  { id: "OPf0YbXqDm0", title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", category: "Trend" },
  { id: "CevxZvSJLk8", title: "Roar", artist: "Katy Perry", category: "Trend" },
  { id: "fJ9rUzIMcZQ", title: "Bohemian Rhapsody", artist: "Queen", category: "US-UK" },
  { id: "pRpeEdMmmQ0", title: "Waka Waka", artist: "Shakira", category: "US-UK" },
  { id: "C-u5WLJ9Yk4", title: "...Baby One More Time", artist: "Britney Spears", category: "US-UK" },
  { id: "hTWKbfoikeg", title: "Smells Like Teen Spirit", artist: "Nirvana", category: "US-UK" },
  { id: "kXYiU_JCYtU", title: "Numb", artist: "Linkin Park", category: "US-UK" },
  { id: "eVTXPUF4Oz4", title: "In The End", artist: "Linkin Park", category: "US-UK" },
  { id: "Zi_XLOBDo_Y", title: "Billie Jean", artist: "Michael Jackson", category: "US-UK" },
  { id: "1w7OgIMMRc4", title: "Sweet Child O' Mine", artist: "Guns N' Roses", category: "US-UK" },
  { id: "djV11Xbc914", title: "Take On Me", artist: "a-ha", category: "US-UK" },
  { id: "4fndeDfaWCg", title: "I Want It That Way", artist: "Backstreet Boys", category: "US-UK" },
  { id: "ru0K8uYEZWw", title: "CAN'T STOP THE FEELING!", artist: "Justin Timberlake", category: "US-UK" },
  { id: "PMivT7MJ41M", title: "That's What I Like", artist: "Bruno Mars", category: "US-UK" },
  { id: "YlUKcNNmywk", title: "Californication", artist: "Red Hot Chili Peppers", category: "US-UK" },
  { id: "9jK-NcRmVcw", title: "The Final Countdown", artist: "Europe", category: "US-UK" },
  { id: "u9Dg-g7t2l4", title: "The Sound Of Silence", artist: "Disturbed", category: "US-UK" },
  { id: "RubBzkZzpUA", title: "Started From the Bottom", artist: "Drake", category: "US-UK" },
  { id: "Hbb5GPxXF1w", title: "SNEAKERS", artist: "ITZY", category: "K-Pop" },
  { id: "jfKfPfyJRdk", title: "lofi hip hop radio", artist: "Lofi Girl", category: "Lofi" },
  { id: "5qap5aO4i9A", title: "lofi beats to relax/study", artist: "Lofi Girl", category: "Lofi" },
  { id: "lTRiuFIWV54", title: "1 A.M Study Session", artist: "Lofi Girl", category: "Lofi" },
  { id: "DWcJFNfaw9c", title: "lofi sleep/chill", artist: "Lofi Girl", category: "Lofi" },
  { id: "4xDzrJKXOOY", title: "synthwave radio", artist: "Lofi Girl", category: "Lofi" },
  { id: "5yx6BWlEVcY", title: "Chillhop Radio", artist: "Chillhop Music", category: "Lofi" },
  { id: "lYBUbBu4W08", title: "Never Gonna Give You Up", artist: "Rick Astley", category: "Trend" },
];

/** Gợi ý từ khóa tìm “nhạc nổi” VN + quốc tế qua YouTube API */
export const TREND_QUERIES = [
  "nhạc việt nam hay nhất",
  "vpop ballad 2024 2025",
  "nhạc trẻ việt nam",
  "sơn tùng m-tp",
  "hoàng thùy linh",
  "đen vâu",
  "mỹ tâm",
  "jack 97",
  "nhạc remix việt",
  "lofi việt nam",
];

/** Ưu tiên nhạc Việt — random mỗi lần reload */
export const VN_MUSIC_QUERIES = [
  "nhạc việt nam 2024 2025",
  "vpop hits",
  "nhạc trẻ việt nam hay nhất",
  "ballad việt nam",
  "rap việt nam",
  "nhạc vàng remix",
  "sơn tùng MTP official",
  "hieuthuhai",
  "tlinh official",
  "wren evans",
  "bùi anh tuấn",
  "hòa minzy",
  "chi pu official",
  "amee official",
  "phương ly",
];

export function pickRandomQueries(n = 1): string[] {
  const pool = [...VN_MUSIC_QUERIES, ...TREND_QUERIES];
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function shuffleTracks<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
