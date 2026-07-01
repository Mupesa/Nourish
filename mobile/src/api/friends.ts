/**
 * Friend-graph API client. Mirrors the backend /api/v1/social/* friend routes.
 */
import { api } from "./client";
import { Friend, FriendRequestCard, SearchResult } from "../types/domain";

export function searchUsers(q: string): Promise<SearchResult[]> {
  return api
    .get<{ users: SearchResult[] }>(
      `/api/v1/social/users/search?q=${encodeURIComponent(q)}`,
    )
    .then((r) => r.users);
}

export function listFriends(): Promise<Friend[]> {
  return api
    .get<{ friends: Friend[] }>("/api/v1/social/friends")
    .then((r) => r.friends);
}

export function listRequests(): Promise<{
  incoming: FriendRequestCard[];
  outgoing: FriendRequestCard[];
}> {
  return api.get<{
    incoming: FriendRequestCard[];
    outgoing: FriendRequestCard[];
  }>("/api/v1/social/friends/requests");
}

/** Returns "requested" | "accepted" | "already_pending". */
export function sendFriendRequest(toUid: string): Promise<string> {
  return api
    .post<{ result: string }>("/api/v1/social/friends/requests", { toUid })
    .then((r) => r.result);
}

export function acceptRequest(fromUid: string): Promise<Friend> {
  return api
    .post<{ friend: Friend }>(
      `/api/v1/social/friends/requests/${fromUid}/accept`,
    )
    .then((r) => r.friend);
}

export function declineRequest(fromUid: string): Promise<void> {
  return api
    .post<{ ok: boolean }>(`/api/v1/social/friends/requests/${fromUid}/decline`)
    .then(() => undefined);
}

export function cancelRequest(toUid: string): Promise<void> {
  return api
    .del<{ ok: boolean }>(`/api/v1/social/friends/requests/${toUid}`)
    .then(() => undefined);
}

export function unfriend(uid: string): Promise<void> {
  return api
    .del<{ ok: boolean }>(`/api/v1/social/friends/${uid}`)
    .then(() => undefined);
}

export function blockUser(uid: string): Promise<void> {
  return api
    .post<{ ok: boolean }>(`/api/v1/social/blocks/${uid}`)
    .then(() => undefined);
}

export function unblockUser(uid: string): Promise<void> {
  return api
    .del<{ ok: boolean }>(`/api/v1/social/blocks/${uid}`)
    .then(() => undefined);
}
