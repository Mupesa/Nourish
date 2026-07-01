/**
 * Feed routes — the friends-only "Cooked Today" feed + profile post grids.
 * All require authentication.
 */
import { Router } from "express";
import { asyncHandler } from "../http/async-handler";
import { requireUser } from "../http/middleware/auth";
import { parse } from "../http/validate";
import {
  createPostSchema,
  feedQuerySchema,
  reportPostSchema,
  uidParamSchema,
} from "../domain/validation";
import {
  createPost,
  deletePost,
  likePost,
  listFeed,
  listUserPosts,
  reportPost,
  unlikePost,
} from "../services/feed.service";
import { getRelationship } from "../services/friends.service";

export const feedRouter = Router();

/** GET /feed?before=&limit= — friends + self, newest first. */
feedRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const { before, limit } = parse(feedQuerySchema, req.query);
    const posts = await listFeed(user.uid, { before, limit });
    res.json({ posts });
  }),
);

/** POST /feed/posts — create a post (image already uploaded to Storage). */
feedRouter.post(
  "/posts",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const input = parse(createPostSchema, req.body);
    const post = await createPost(user, input);
    res.status(201).json({ post });
  }),
);

/** DELETE /feed/posts/:id — author only. */
feedRouter.delete(
  "/posts/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const id = parse(uidParamSchema, req.params.id);
    await deletePost(user, id);
    res.json({ ok: true });
  }),
);

/** POST /feed/posts/:id/like — like (idempotent). */
feedRouter.post(
  "/posts/:id/like",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const id = parse(uidParamSchema, req.params.id);
    res.json(await likePost(user, id));
  }),
);

/** DELETE /feed/posts/:id/like — unlike (idempotent). */
feedRouter.delete(
  "/posts/:id/like",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const id = parse(uidParamSchema, req.params.id);
    res.json(await unlikePost(user, id));
  }),
);

/** POST /feed/posts/:id/report — flag a post for moderation. */
feedRouter.post(
  "/posts/:id/report",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const id = parse(uidParamSchema, req.params.id);
    const input = parse(reportPostSchema, req.body);
    await reportPost(user, id, input);
    res.status(201).json({ ok: true });
  }),
);

/** GET /feed/users/:uid/posts — a user's posts (hidden if they blocked you). */
feedRouter.get(
  "/users/:uid/posts",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const authorUid = parse(uidParamSchema, req.params.uid);
    const relationship = await getRelationship(user.uid, authorUid);
    if (relationship === "blocked_by") {
      res.json({ posts: [] });
      return;
    }
    const posts = await listUserPosts(user.uid, authorUid);
    res.json({ posts });
  }),
);
