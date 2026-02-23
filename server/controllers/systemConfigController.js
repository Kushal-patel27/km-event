import SystemConfig from "../models/SystemConfig.js";

export const getPublicSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findById("system_config");

    if (!config) {
      config = new SystemConfig({ _id: "system_config" });
      await config.save();
    }

    res.json({
      ticketLimits: {
        maxPerEvent: config.ticketLimits?.maxPerEvent ?? 1000,
        maxPerUser: config.ticketLimits?.maxPerUser ?? 10
      }
    });
  } catch (error) {
    console.error("[PUBLIC CONFIG ERROR]", error);
    res.status(500).json({ message: "Failed to load public configuration" });
  }
};
