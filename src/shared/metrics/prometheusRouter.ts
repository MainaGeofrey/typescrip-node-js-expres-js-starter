// src/shared/metrics/prometheusRouter.ts
import express from "express";
import { rawMetricsCollector } from "./metricsCollector";

export function createPrometheusRouter(): express.Router {
  const router = express.Router();
  rawMetricsCollector.enablePrometheusMode();

  router.get("/", (req, res) => {
    try {
      const metrics = rawMetricsCollector.getPrometheusMetrics();
      res.setHeader("Content-Type", "text/plain");
      res.send(metrics);
    } catch (err: any) {
      res.status(500).send("Failed to generate metrics: " + err.message);
    }
  });

  return router;
}
