/**
 * Social routes — public profiles, the unique handle index, and the friend
 * graph (search, requests, friends, blocks). All require authentication
 * (anonymous is fine). Feed + moderation arrive in later Phase 3 stages.
 */
import { Router } from "express";
import { asyncHandler } from "../http/async-handler";
import { requireUser } from "../http/middleware/auth";
import { parse } from "../http/validate";
import {
  claimHandleSchema,
  sendFriendRequestSchema,
  socialProfileUpdateSchema,
  uidParamSchema,
  userSearchSchema,
} from "../domain/validation";
import {
  claimHandle,
  getMyProfile,
  getPublicProfile,
  updateSocialProfile,
} from "../services/social.service";
import {
  acceptRequest,
  blockUser,
  cancelRequest,
  declineRequest,
  getRelationship,
  listBlocks,
  listFriends,
  listRequests,
  searchUsers,
  sendRequest,
  unblockUser,
  unfriend,
} from "../services/friends.service";

export const socialRouter = Router();

/** GET /social/me — the caller's own public profile (created if missing). */
socialRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const profile = await getMyProfile(user);
    res.json({ profile });
  }),
);

/** PUT /social/handle — claim or change the caller's unique @handle. */
socialRouter.put(
  "/handle",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const input = parse(claimHandleSchema, req.body);
    const profile = await claimHandle(user, input);
    res.json({ profile });
  }),
);

/** PATCH /social/profile — update display name / bio / photo. */
socialRouter.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const input = parse(socialProfileUpdateSchema, req.body);
    const profile = await updateSocialProfile(user, input);
    res.json({ profile });
  }),
);

// ---- Friend graph ----

/** GET /social/users/search?q= — handle prefix search (must precede /:uid). */
socialRouter.get(
  "/users/search",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const { q } = parse(userSearchSchema, req.query);
    const users = await searchUsers(user, q);
    res.json({ users });
  }),
);

/** GET /social/friends — the caller's friends. */
socialRouter.get(
  "/friends",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const friends = await listFriends(user.uid);
    res.json({ friends });
  }),
);

/** GET /social/friends/requests — incoming + outgoing pending requests. */
socialRouter.get(
  "/friends/requests",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const requests = await listRequests(user.uid);
    res.json(requests);
  }),
);

/** POST /social/friends/requests { toUid } — send (or auto-accept reverse). */
socialRouter.post(
  "/friends/requests",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const { toUid } = parse(sendFriendRequestSchema, req.body);
    const result = await sendRequest(user, toUid);
    res.status(result === "requested" ? 201 : 200).json({ result });
  }),
);

/** POST /social/friends/requests/:fromUid/accept */
socialRouter.post(
  "/friends/requests/:fromUid/accept",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const fromUid = parse(uidParamSchema, req.params.fromUid);
    const friend = await acceptRequest(user, fromUid);
    res.json({ friend });
  }),
);

/** POST /social/friends/requests/:fromUid/decline */
socialRouter.post(
  "/friends/requests/:fromUid/decline",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const fromUid = parse(uidParamSchema, req.params.fromUid);
    await declineRequest(user, fromUid);
    res.json({ ok: true });
  }),
);

/** DELETE /social/friends/requests/:toUid — cancel an outgoing request. */
socialRouter.delete(
  "/friends/requests/:toUid",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const toUid = parse(uidParamSchema, req.params.toUid);
    await cancelRequest(user, toUid);
    res.json({ ok: true });
  }),
);

/** DELETE /social/friends/:uid — unfriend. */
socialRouter.delete(
  "/friends/:uid",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const friendUid = parse(uidParamSchema, req.params.uid);
    await unfriend(user, friendUid);
    res.json({ ok: true });
  }),
);

/** GET /social/blocks — users the caller has blocked. */
socialRouter.get(
  "/blocks",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const blocked = await listBlocks(user.uid);
    res.json({ blocked });
  }),
);

/** POST /social/blocks/:uid — block a user. */
socialRouter.post(
  "/blocks/:uid",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const targetUid = parse(uidParamSchema, req.params.uid);
    await blockUser(user, targetUid);
    res.json({ ok: true });
  }),
);

/** DELETE /social/blocks/:uid — unblock. */
socialRouter.delete(
  "/blocks/:uid",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const targetUid = parse(uidParamSchema, req.params.uid);
    await unblockUser(user, targetUid);
    res.json({ ok: true });
  }),
);

/** GET /social/users/:uid — any user's public profile + relationship. */
socialRouter.get(
  "/users/:uid",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const targetUid = parse(uidParamSchema, req.params.uid);
    const relationship = await getRelationship(user.uid, targetUid);
    if (relationship === "blocked_by") {
      // Hide the existence of someone who blocked the caller.
      res.status(404).json({ error: { code: "not_found", message: "User not found." } });
      return;
    }
    const profile = await getPublicProfile(targetUid);
    res.json({ profile, relationship });
  }),
);
