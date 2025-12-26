import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import db from "../db/index.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

router.use(requireAuth);

/**
 * GET /api/iris/history
 * List generated videos for the current user
 */
router.get("/history", (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const stmt = db.prepare(`
      SELECT * FROM iris_videos 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `);

    const history = stmt.all(userId, limit, offset);
    res.json(history);
  } catch (error) {
    console.error("Error fetching Iris history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

/**
 * POST /api/iris/history
 * Save a new generated video record
 */
router.post("/history", (req, res) => {
  try {
    const userId = req.userId;
    const { videoUrl, prompt, model, aspectRatio, resolution, thumbnailUrl } =
      req.body;

    if (!videoUrl || !prompt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = uuidv4();
    const createdAt = Date.now();

    const stmt = db.prepare(`
      INSERT INTO iris_videos (id, userId, videoUrl, thumbnailUrl, prompt, model, aspectRatio, resolution, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      videoUrl,
      thumbnailUrl || null,
      prompt,
      model || "veo",
      aspectRatio || "16:9",
      resolution || "720p",
      createdAt
    );

    res.status(201).json({
      success: true,
      video: {
        id,
        userId,
        videoUrl,
        thumbnailUrl,
        prompt,
        model,
        aspectRatio,
        resolution,
        createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving Iris video:", error);
    res.status(500).json({ error: "Failed to save video record" });
  }
});

/**
 * DELETE /api/iris/history/:id
 * Delete a video record (Note: this only deletes the metadata record, not the actual file if stored externally)
 */
router.delete("/history/:id", (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const stmt = db.prepare(
      "DELETE FROM iris_videos WHERE id = ? AND userId = ?"
    );
    const result = stmt.run(id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Video not found or unauthorized" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting Iris video:", error);
    res.status(500).json({ error: "Failed to delete video record" });
  }
});

export default router;
