export interface User {
  _id: string;
  username: string;
  password: string;
  profile?: {
    description?: string;
    picture?: string;
  };
  createdAt?: string | Date;
  friends?: string[];
}

export interface Game {
  _id: string;
  name: string;
  gameMembers: User[];
  leader: User;
  date: string | Date;
  location: string;
  fsq_id: string;
  sport: string;
  description?: string;
}