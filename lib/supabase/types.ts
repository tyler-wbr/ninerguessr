export type Difficulty = "easy" | "medium" | "hard";
export type GameStatus = "in_progress" | "completed" | "abandoned";
export type GameMode = "casual" | "daily";

export type Profile = {
  id: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
};

export type Location = {
  id: string;
  image_path: string;
  lat: number;
  lng: number;
  difficulty: Difficulty;
  title: string | null;
  hint: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
};

export type Game = {
  id: string;
  user_id: string;
  difficulty: Difficulty | null;
  game_mode: GameMode;
  challenge_date: string | null;
  status: GameStatus;
  total_score: number;
  current_round: number;
  started_at: string;
  completed_at: string | null;
};

export type GameRound = {
  id: string;
  game_id: string;
  location_id: string;
  round_number: number;
  round_difficulty: Difficulty | null;
  guess_lat: number | null;
  guess_lng: number | null;
  distance_m: number | null;
  distance_points: number | null;
  time_ms: number | null;
  points: number | null;
  round_started_at: string | null;
  guessed_at: string | null;
};
