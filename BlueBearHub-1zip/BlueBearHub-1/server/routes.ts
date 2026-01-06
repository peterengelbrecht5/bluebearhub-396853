import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertUserSchema, insertElectionSchema, insertContestSchema, insertOptionSchema, insertVoteSchema } from "@shared/schema";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Middleware to check if user is admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// Middleware to load user from session
async function loadUser(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    const user = await storage.getUser(req.session.userId);
    if (user) {
      req.user = user;
    }
  }
  next();
}

import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(loadUser);

  registerChatRoutes(app);
  registerImageRoutes(app);

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // SECURITY: Always create voters, ignore client-supplied role
      // Admins must be created server-side via bootstrap
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
        role: "voter", // Force voter role for all registrations
      });

      // Log the registration
      await storage.createAuditLog({
        userId: user.id,
        action: "user_registered",
        entityType: "user",
        entityId: user.id,
      });

      // SECURITY: Regenerate session to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ error: "Session error" });
        }
        
        // Set session after regeneration
        req.session.userId = user.id;

        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Log the login
      await storage.createAuditLog({
        userId: user.id,
        action: "user_login",
        entityType: "user",
        entityId: user.id,
      });

      // SECURITY: Regenerate session to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ error: "Session error" });
        }
        
        req.session.userId = user.id;

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(401).json({ error: "User session invalid" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Election routes (admin only)
  app.get("/api/elections", requireAuth, async (req, res) => {
    if (req.user?.role === "admin") {
      const elections = await storage.getAllElections();
      res.json(elections);
    } else {
      // Voters only see elections they're eligible for
      const eligibleElectionIds = await storage.getEligibleElectionsForUser(req.user!.id);
      const elections = await storage.getAllElections();
      const filtered = elections.filter(e => eligibleElectionIds.includes(e.id));
      res.json(filtered);
    }
  });

  app.post("/api/elections", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertElectionSchema.parse(req.body);
      const election = await storage.createElection(data);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "election_created",
        entityType: "election",
        entityId: election.id,
      });

      res.json(election);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.get("/api/elections/:id", requireAuth, async (req, res) => {
    const election = await storage.getElection(req.params.id);
    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    // Check if voter is eligible
    if (req.user?.role !== "admin") {
      const eligible = await storage.isVoterEligible(election.id, req.user!.id);
      if (!eligible) {
        return res.status(403).json({ error: "Not eligible for this election" });
      }
    }

    res.json(election);
  });

  app.patch("/api/elections/:id", requireAuth, requireAdmin, async (req, res) => {
    const election = await storage.updateElection(req.params.id, req.body);
    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    await storage.createAuditLog({
      userId: req.user!.id,
      action: "election_updated",
      entityType: "election",
      entityId: election.id,
    });

    res.json(election);
  });

  app.delete("/api/elections/:id", requireAuth, requireAdmin, async (req, res) => {
    const success = await storage.deleteElection(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Election not found" });
    }

    await storage.createAuditLog({
      userId: req.user!.id,
      action: "election_deleted",
      entityType: "election",
      entityId: req.params.id,
    });

    res.json({ success: true });
  });

  // Contest routes
  app.get("/api/elections/:electionId/contests", requireAuth, async (req, res) => {
    const contests = await storage.getContestsByElection(req.params.electionId);
    res.json(contests);
  });

  app.post("/api/elections/:electionId/contests", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertContestSchema.parse({ 
        ...req.body, 
        electionId: req.params.electionId 
      });
      const contest = await storage.createContest(data);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "contest_created",
        entityType: "contest",
        entityId: contest.id,
      });

      res.json(contest);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Option routes
  app.get("/api/contests/:contestId/options", requireAuth, async (req, res) => {
    const options = await storage.getOptionsByContest(req.params.contestId);
    res.json(options);
  });

  app.post("/api/contests/:contestId/options", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertOptionSchema.parse({ 
        ...req.body, 
        contestId: req.params.contestId 
      });
      const option = await storage.createOption(data);
      res.json(option);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.delete("/api/options/:id", requireAuth, requireAdmin, async (req, res) => {
    const success = await storage.deleteOption(req.params.id);
    res.json({ success });
  });

  // Eligible voter routes
  app.get("/api/elections/:electionId/eligible-voters", requireAuth, requireAdmin, async (req, res) => {
    const voters = await storage.getEligibleVotersByElection(req.params.electionId);
    res.json(voters);
  });

  app.post("/api/elections/:electionId/eligible-voters", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      const voter = await storage.addEligibleVoter({
        electionId: req.params.electionId,
        userId,
      });
      res.json(voter);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Voting routes
  app.post("/api/votes", requireAuth, async (req, res) => {
    try {
      const data = insertVoteSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Check if already voted
      const existing = await storage.hasVoted(req.user!.id, data.contestId);
      if (existing) {
        return res.status(400).json({ error: "Already voted in this contest" });
      }

      // Check eligibility
      const contest = await storage.getContest(data.contestId);
      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      const eligible = await storage.isVoterEligible(contest.electionId, req.user!.id);
      if (!eligible) {
        return res.status(403).json({ error: "Not eligible to vote in this election" });
      }

      const vote = await storage.castVote(data);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "vote_cast",
        entityType: "vote",
        entityId: vote.id,
        details: JSON.stringify({ contestId: data.contestId }),
      });

      res.json(vote);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Results routes (admin only)
  app.get("/api/contests/:contestId/results", requireAuth, requireAdmin, async (req, res) => {
    const votes = await storage.getVotesByContest(req.params.contestId);
    const options = await storage.getOptionsByContest(req.params.contestId);
    
    // Count votes for each option
    const results = options.map(option => {
      const count = votes.filter(v => v.optionIds.includes(option.id)).length;
      return {
        ...option,
        voteCount: count,
      };
    });

    res.json({
      totalVotes: votes.length,
      results,
    });
  });

  // Admin: Get all users
  app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  // Audit logs (admin only)
  app.get("/api/audit-logs", requireAuth, requireAdmin, async (req, res) => {
    const logs = await storage.getAuditLogs(req.query as any);
    res.json(logs);
  });

  const httpServer = createServer(app);

  return httpServer;
}
