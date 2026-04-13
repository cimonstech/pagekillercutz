export interface UserWrappedData {
  year: number;
  userId: string;
  userEmail: string;
  userName: string;

  music: {
    totalPlays: number;
    topTrack: string | null;
    topGenre: string | null;
    totalMinutes: number;
  };

  merch: {
    totalOrders: number;
    totalSpent: number;
    lastItem: string | null;
  };

  events: {
    totalBookings: number;
    lastEventName: string | null;
    lastEventDate: string | null;
  };
}

export async function generateUserWrapped(
  userId: string,
  year: number,
): Promise<UserWrappedData | null> {
  console.log(`[wrapped] Generate for user ${userId} year ${year}`);
  return null;
}
