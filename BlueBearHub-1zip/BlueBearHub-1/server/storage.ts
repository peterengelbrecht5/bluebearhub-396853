import { 
  type User, type InsertUser,
  type Election, type InsertElection,
  type Contest, type InsertContest,
  type Option, type InsertOption,
  type EligibleVoter, type InsertEligibleVoter,
  type Vote, type InsertVote,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Elections
  createElection(election: InsertElection): Promise<Election>;
  getElection(id: string): Promise<Election | undefined>;
  getAllElections(): Promise<Election[]>;
  updateElection(id: string, election: Partial<InsertElection>): Promise<Election | undefined>;
  deleteElection(id: string): Promise<boolean>;
  
  // Contests
  createContest(contest: InsertContest): Promise<Contest>;
  getContest(id: string): Promise<Contest | undefined>;
  getContestsByElection(electionId: string): Promise<Contest[]>;
  updateContest(id: string, contest: Partial<InsertContest>): Promise<Contest | undefined>;
  deleteContest(id: string): Promise<boolean>;
  
  // Options
  createOption(option: InsertOption): Promise<Option>;
  getOption(id: string): Promise<Option | undefined>;
  getOptionsByContest(contestId: string): Promise<Option[]>;
  deleteOption(id: string): Promise<boolean>;
  
  // Eligible Voters
  addEligibleVoter(eligibleVoter: InsertEligibleVoter): Promise<EligibleVoter>;
  removeEligibleVoter(electionId: string, userId: string): Promise<boolean>;
  getEligibleVotersByElection(electionId: string): Promise<EligibleVoter[]>;
  getEligibleElectionsForUser(userId: string): Promise<string[]>;
  isVoterEligible(electionId: string, userId: string): Promise<boolean>;
  
  // Votes
  castVote(vote: InsertVote): Promise<Vote>;
  getVote(userId: string, contestId: string): Promise<Vote | undefined>;
  getVotesByContest(contestId: string): Promise<Vote[]>;
  hasVoted(userId: string, contestId: string): Promise<boolean>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: string; entityType?: string; entityId?: string }): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private elections: Map<string, Election>;
  private contests: Map<string, Contest>;
  private options: Map<string, Option>;
  private eligibleVoters: Map<string, EligibleVoter>;
  private votes: Map<string, Vote>;
  private auditLogs: Map<string, AuditLog>;

  constructor() {
    this.users = new Map();
    this.elections = new Map();
    this.contests = new Map();
    this.options = new Map();
    this.eligibleVoters = new Map();
    this.votes = new Map();
    this.auditLogs = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Elections
  async createElection(insertElection: InsertElection): Promise<Election> {
    const id = randomUUID();
    const election: Election = { 
      ...insertElection, 
      id, 
      createdAt: new Date() 
    };
    this.elections.set(id, election);
    return election;
  }

  async getElection(id: string): Promise<Election | undefined> {
    return this.elections.get(id);
  }

  async getAllElections(): Promise<Election[]> {
    return Array.from(this.elections.values());
  }

  async updateElection(id: string, update: Partial<InsertElection>): Promise<Election | undefined> {
    const election = this.elections.get(id);
    if (!election) return undefined;
    const updated = { ...election, ...update };
    this.elections.set(id, updated);
    return updated;
  }

  async deleteElection(id: string): Promise<boolean> {
    return this.elections.delete(id);
  }

  // Contests
  async createContest(insertContest: InsertContest): Promise<Contest> {
    const id = randomUUID();
    const contest: Contest = { ...insertContest, id };
    this.contests.set(id, contest);
    return contest;
  }

  async getContest(id: string): Promise<Contest | undefined> {
    return this.contests.get(id);
  }

  async getContestsByElection(electionId: string): Promise<Contest[]> {
    return Array.from(this.contests.values()).filter(c => c.electionId === electionId);
  }

  async updateContest(id: string, update: Partial<InsertContest>): Promise<Contest | undefined> {
    const contest = this.contests.get(id);
    if (!contest) return undefined;
    const updated = { ...contest, ...update };
    this.contests.set(id, updated);
    return updated;
  }

  async deleteContest(id: string): Promise<boolean> {
    return this.contests.delete(id);
  }

  // Options
  async createOption(insertOption: InsertOption): Promise<Option> {
    const id = randomUUID();
    const option: Option = { ...insertOption, id };
    this.options.set(id, option);
    return option;
  }

  async getOption(id: string): Promise<Option | undefined> {
    return this.options.get(id);
  }

  async getOptionsByContest(contestId: string): Promise<Option[]> {
    return Array.from(this.options.values()).filter(o => o.contestId === contestId);
  }

  async deleteOption(id: string): Promise<boolean> {
    return this.options.delete(id);
  }

  // Eligible Voters
  async addEligibleVoter(insertEligibleVoter: InsertEligibleVoter): Promise<EligibleVoter> {
    const id = randomUUID();
    const eligibleVoter: EligibleVoter = { ...insertEligibleVoter, id };
    this.eligibleVoters.set(id, eligibleVoter);
    return eligibleVoter;
  }

  async removeEligibleVoter(electionId: string, userId: string): Promise<boolean> {
    const voter = Array.from(this.eligibleVoters.values()).find(
      v => v.electionId === electionId && v.userId === userId
    );
    if (!voter) return false;
    return this.eligibleVoters.delete(voter.id);
  }

  async getEligibleVotersByElection(electionId: string): Promise<EligibleVoter[]> {
    return Array.from(this.eligibleVoters.values()).filter(v => v.electionId === electionId);
  }

  async getEligibleElectionsForUser(userId: string): Promise<string[]> {
    return Array.from(this.eligibleVoters.values())
      .filter(v => v.userId === userId)
      .map(v => v.electionId);
  }

  async isVoterEligible(electionId: string, userId: string): Promise<boolean> {
    return Array.from(this.eligibleVoters.values()).some(
      v => v.electionId === electionId && v.userId === userId
    );
  }

  // Votes
  async castVote(insertVote: InsertVote): Promise<Vote> {
    const id = randomUUID();
    const vote: Vote = { ...insertVote, id, createdAt: new Date() };
    this.votes.set(id, vote);
    return vote;
  }

  async getVote(userId: string, contestId: string): Promise<Vote | undefined> {
    return Array.from(this.votes.values()).find(
      v => v.userId === userId && v.contestId === contestId
    );
  }

  async getVotesByContest(contestId: string): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(v => v.contestId === contestId);
  }

  async hasVoted(userId: string, contestId: string): Promise<boolean> {
    return Array.from(this.votes.values()).some(
      v => v.userId === userId && v.contestId === contestId
    );
  }

  // Audit Logs
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = { ...insertLog, id, createdAt: new Date() };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogs(filters?: { userId?: string; entityType?: string; entityId?: string }): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values());
    
    if (filters) {
      if (filters.userId) {
        logs = logs.filter(l => l.userId === filters.userId);
      }
      if (filters.entityType) {
        logs = logs.filter(l => l.entityType === filters.entityType);
      }
      if (filters.entityId) {
        logs = logs.filter(l => l.entityId === filters.entityId);
      }
    }
    
    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
