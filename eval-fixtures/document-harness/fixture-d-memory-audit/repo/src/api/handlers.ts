import { Router } from "express";
import { getUser, createNotification } from "../store";

export const api = Router();

api.get("/users/:id", async (req, res) => {
  const user = await getUser(req.params.id);
  if (!user) {
    return res.status(404).json({ code: "user_not_found", message: "User does not exist" });
  }
  res.json({
    userId: user.id,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  });
});

api.post("/notifications", async (req, res) => {
  const result = await createNotification(req.body);
  res.status(201).json({
    notificationId: result.id,
    acceptedAt: result.acceptedAt.toISOString(),
  });
});
