/**
 * @deprecated Ce fichier est DEPRECATED
 * Utiliser agent.discussion-memories.ts à la place
 * 
 * L'ancien système de mémoire automatique (enrichWithMemory) est désactivé.
 * Le nouveau système utilise capture() sur demande utilisateur.
 */

//
// api for memories (DEPRECATED)
import { getMemoriesAsPrefix, getMemoriesAsSystem, MemoriesLite, SearchResult } from "memories-lite";
import { AgentConfig, AgenticContext, AgentStateGraph, UserNano } from "agentic-api";
import { memoriesConfig } from "../config/memories";
import { todayPrompt } from "../agents/SGC/prompts";

// initialize the user memories
export const memories = new MemoriesLite(memoriesConfig);

//
// Contextualiser avec la mémoire
export async function enrichPromptWithMemory(query: string, agent: AgentConfig, context: AgenticContext):Promise<string> {

  if (context.user.isAnonymous || agent.cancelMemory) {
    return `${query}`;
  }
  // 2. Rechercher des souvenirs pertinents (exclure les préférences de l'assistant)
  const matches:SearchResult = await memories.retrieve(query, context.user.id!,{});
  const enrichedContext = getMemoriesAsPrefix(matches.results)

  // console.log('--- 🧠 enrichPromptMemory', enrichedContext);
  return `${query}\n${enrichedContext}`;
}


//
// capture memory with the last message
export async function captureMemoryWithLastMessage(query: string, stateGraph: AgentStateGraph, agent: AgentConfig, context: AgenticContext): Promise<void> {
  if (context.user.isAnonymous || agent.cancelMemory) {
    return;
  }
  
  const discussion = stateGraph.createOrRestore(agent.name);
  if (discussion.messages.length === 0) {
    return;
  }
  
  const assistant = discussion.messages[discussion.messages.length - 1];
  const messages = [
    { role: "user", content: query },
    { role: "assistant", content: assistant.content }
  ];
  await memories.capture(messages, context.user.id!, {});
}

/**
 * Fonction d'enrichissement pour executeAgentSet
 * Gère l'enrichissement du prompt selon le rôle (user/system/assistant)
 * 
 * @param role - Le rôle (user/system/assistant)
 * @param agent - Configuration de l'agent
 * @param context - Contexte avec user et stateGraph
 * @param prompt - Le prompt original (pour user)
 * @param stateGraph - StateGraph pour capture assistant
 * @returns String enrichi ou vide
 */
export async function enrichWithMemory(
  role: string, 
  agent: AgentConfig, 
  context: AgenticContext,
  prompt?: string,
  stateGraph?: AgentStateGraph
): Promise<string> {
  if (context.currentAgent?.cancelMemory) {
    return '';
  }
  
  if (role === 'user' && prompt) {
    return await enrichPromptWithMemory(prompt, agent, context);
  }
  // else if (role === 'system') {
  //   return await enrichSystemWithMemory('system', agent, context);
  // }
  else if (role === 'assistant' && prompt && stateGraph) {
    await captureMemoryWithLastMessage(prompt, stateGraph, agent, context);
  }
  
  return '';
}

/**
 * Enriches system prompt with user's assistant preferences from memory
 * @param role - The role for which to enrich the system prompt
 * @param params - Parameters containing userId and optional customRules
 * @returns Promise with the enriched system prompt string
 */
export async function enrichSystemWithMemory(role: string, agent: AgentConfig, context: AgenticContext): Promise<string> {
  //
  // ajouter la date et l'heure du jour

  const user = context.user;
  const PREFIX = `\n\n# IDENTITÉ UTILISATEUR :\n- ${todayPrompt()}\n`;
  if (user.isAnonymous || agent.cancelMemory) {
    return PREFIX+'- Utilisateur Anonyme';
  }
  const msal:any[] = [];
  Object.keys(user).forEach(key=>{
    if(key !== 'id' && key !== 'role' && key !== 'uid'){
      msal.push(key+': '+user[key as keyof UserNano]);
    }
  });
  const userCard = PREFIX + msal.filter(Boolean).map(m=>`- ${m}`).join('\n')+'\n\n';

  const matches: SearchResult = await memories.getAll(user.id, { type: 'assistant_preference' });
  const enrichedSystem = userCard+getMemoriesAsSystem(matches.results);
  console.log('--- 🧠 enrichSystemWithMemory', matches.results.length, enrichedSystem);
  return enrichedSystem;
}
