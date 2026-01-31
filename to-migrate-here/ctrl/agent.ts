import { Request, Response, Router } from 'express';
import { executeAgentSet, AgenticContext, sessionStateGraphGet, sessionStateGraphSet, sessionStateGraphClear } from 'agentic-api';
import { PRMaster } from '../agents/SGC';
import { promisify } from 'util';
import { sendTelegramMessage } from '../server.helper';
import { getCredentialFromRequest } from '../middleware/authMiddleware';
import { enrichWithMemory } from './agent.discussion-memories';

const router = Router();
const sgcAgents = [PRMaster];

export const ctrlGetHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;  // ✅ Depuis cache LRU
    
    // Create context for StateGraph operations
    const context: AgenticContext = {
      user: user || { id: `anon-${req.sessionID}`, role: 'anonymous' },
      session: req.session
    };
    
    // Get agent from URL parameter or use default
    const requestedAgent = req.params.agent;
    // Handle 'current' as alias for default agent
    const agentName = requestedAgent === 'current' 
      ? (process.env.INITIAL_AGENT!)
      : (requestedAgent || process.env.INITIAL_AGENT!);
    
    
    // Handle clearing history explicitly
    if ('clear' in req.query) {
      sessionStateGraphClear(context);
      await promisify(req.session.save).bind(req.session)();
      
      // Return empty state after clear
      const stateGraph = sessionStateGraphGet(context);
      const discussion = stateGraph.toClientView(agentName);
      res.json(discussion); 
      return;
    }
    
    // Get StateGraph via session (creates automatically if needed)
    const stateGraph = sessionStateGraphGet(context);
    const discussion = stateGraph.toClientView(agentName);
    res.json(discussion);

  } catch (err) {
    console.error('Failed operation in ctrlGetHistory:', err);
    res.status(500).send('Failed to process history request');
  }
};

export const ctrlDeleteHistoryMessage = async (req: Request, res: Response): Promise<void> => {
  const messageId = req.params.id;
  if (!messageId) {
    res.status(400).send("Invalid message id");
    return;
  }
  
  const user = req.user!;  // ✅ Depuis cache LRU
  
  // Create context for StateGraph operations (same pattern as ctrlGetHistory)
  const context: AgenticContext = {
    user: user || { id: `anon-${req.sessionID}`, role: 'anonymous' },
    session: req.session
  };
  
  // Get StateGraph via session (creates automatically if needed)
  const stateGraph = sessionStateGraphGet(context);
  // Get agent from URL parameter or use default
  const requestedAgent = req.params.agent;
  // Handle 'current' as alias for default agent
  const runningAgent = requestedAgent === 'current' 
    ? (process.env.INITIAL_AGENT!)
    : (requestedAgent || process.env.INITIAL_AGENT!);

  // Use API method to delete the message
  const messageDeleted = stateGraph.deleteMessage(runningAgent, messageId);
  
  if (messageDeleted) {
    // Save the updated StateGraph
    sessionStateGraphSet(context, stateGraph);
    await promisify(req.session.save).bind(req.session)();
  }
  
  const clientView = stateGraph.toClientView(runningAgent);
  res.json(clientView);
};

export const ctrlExecuteAgent = async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'public, max-age=0');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');

  // ✅ Get user from cache LRU (populated by ensureAuthenticated middleware)
  const user = req.user!;
  
  // ✅ Add the credential to the context for agentic-api (fallback to session data if needed)
  const credential = getCredentialFromRequest(req);
  console.log(`--- Executing agent for user: ${user.displayName || user.id}`);

  // Get agent from URL parameter, fallback to body, or use default
  const requestedAgent = req.params.agent || req.body.agent;
  // Handle 'current' as alias for default agent
  const runningAgent = requestedAgent === 'current' 
    ? (process.env.INITIAL_AGENT!)
    : (requestedAgent || process.env.INITIAL_AGENT!);
  const prompt = req.body.query || "Bonjour, qui es-tu ?";
  const thinking = req.body.thinking || false;
  // Create context for new executeAgentSet signature
  // ✅ Passer l'utilisateur COMPLET avec toutes ses propriétés dynamiques
  const context: AgenticContext = {
    user: user,  // ✅ User complet depuis cache (avec displayName, email, etc.)
    credential,
    session: req.session  // Add session for StateGraph access
  };


  //
  // FIXME: security issue here (should be controlled by a secure middleware)
  const ragname = req.body.ragname || req.query.ragname;
  if(ragname){
    context.customRag = ragname;
  }

  //
  // ✅ Extract and validate rules (MEM_MANUAL memory IDs)
  const rawRules = req.body.rules;
  const rules: string[] = Array.isArray(rawRules) 
    ? rawRules.filter((r: any) => typeof r === 'string')
    : [];
  
  //
  // ✅ Store rules in context for enrichWithMemory
  if (rules.length) {
    (context as any).rules = rules;
  }

  //
  // Skip Telegram notification for test/dev users
  // - gerance1@, gerance2@, etc. (test accounts)
  // - *@evaletolab.ch (dev accounts)
  const email = (user.email || '').toLowerCase();
  const localPart = email.split('@')[0] || '';
  const isTestUser = /^gerance\d+$/.test(localPart) || email.endsWith('@evaletolab.ch');
  
  if (!isTestUser) {
    sendTelegramMessage({ 
      text: `🔍 *Question (rag:${ragname}):*${prompt}\n\n*${user.displayName}*`,
      parseMode: 'Markdown',
      disableWebPagePreview: true,
      disableNotification: false
    }).catch(error => console.error('Error sending telegram message:', error));
  }

  //
  // Execute the agent, 
  // enriching the system prompt with the user's profile
  try {
    await executeAgentSet(sgcAgents, context, {
      query: prompt,
      home: runningAgent,
      thinking: thinking,
      stdout: res,
      verbose: true,
      debug: false,
      enrichWithMemory
    });

    // 💾 Persist StateGraph to SQLite after execution
    // executeAgentSet calls sessionStateGraphSet internally, but session.save() is required
    // to persist the session data to the SQLite store (with resave:false config)
    await promisify(req.session.save).bind(req.session)();

  } catch (agentError) {
     console.error('Error during agent execution:', agentError);
     if (!res.writableEnded) { res.status(500).end('Agent execution failed'); return; }
  }
  
  if (!res.writableEnded) { res.end(); }
};


// Assets route moved to main server - see server.ts
// Memories routes moved to agent.discussion-memories.ts
router.get    ('/:agent/history', ctrlGetHistory);
router.post   ('/:agent/history/:discussion/:id', ctrlDeleteHistoryMessage);
router.post   ('/:agent', ctrlExecuteAgent);

export const ctrlAgent = router; 