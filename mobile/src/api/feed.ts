/**
 * Feed API client — the friends-only "Cooked Today" feed + profile post grids.
 */
import { api } from "./client";
import { FeedPost, Post } from "../types/domain";

export interface CreatePostBody {
  imageUrl: string;
  imagePath: string;
  caption: string;
  kcal: number | null;
  recipeId?: string | null;
}

export interface LikeResult {
  likeCount: number;
  likedByMe: boolean;
}

export function createPost(body: CreatePostBody): Promise<Post> {
  return api.post<{ post: Post }>("/api/v1/feed/posts", body).then((r) => r.post);
}

export function deletePost(id: string): Promise<void> {
  return api.del<{ ok: boolean }>(`/api/v1/feed/posts/${id}`).then(() => undefined);
}

export function listFeed(opts?: {
  before?: number;
  limit?: number;
}): Promise<FeedPost[]> {
  const params: string[] = [];
  if (opts?.before) params.push(`before=${opts.before}`);
  if (opts?.limit) params.push(`limit=${opts.limit}`);
  const qs = params.length ? `?${params.join("&")}` : "";
  return api.get<{ posts: FeedPost[] }>(`/api/v1/feed${qs}`).then((r) => r.posts);
}

export function listUserPosts(uid: string): Promise<FeedPost[]> {
  return api
    .get<{ posts: FeedPost[] }>(`/api/v1/feed/users/${uid}/posts`)
    .then((r) => r.posts);
}

export function reportPost(
  id: string,
  reason: string,
  note = "",
): Promise<void> {
  return api
    .post<{ ok: boolean }>(`/api/v1/feed/posts/${id}/report`, { reason, note })
    .then(() => undefined);
}

export function likePost(id: string): Promise<LikeResult> {
  return api.post<LikeResult>(`/api/v1/feed/posts/${id}/like`);
}

export function unlikePost(id: string): Promise<LikeResult> {
  return api.del<LikeResult>(`/api/v1/feed/posts/${id}/like`);
}
