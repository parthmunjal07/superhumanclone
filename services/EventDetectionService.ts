import { generateObject } from 'ai';
import { openrouter, sanitizeLongText } from '@/lib/ai';
import { z } from 'zod';

/**
 * 1. Smart Chips Detection
 * Detects if an incoming email contains a meeting request or a bug/feature request
 * so the UI can render "Add to calendar" or "Create Linear issue" chips.
 */
export async function detectSmartChips(emailSubject: string, emailBody: string, from: string, to: string) {
  const content = sanitizeLongText(`Subject: ${emailSubject}\n\nBody: ${emailBody}`, 1500);
  
  try {
    const { object } = await generateObject({
      model: openrouter('anthropic/claude-3-haiku'),
      system: 'You are an AI assistant that extracts calendar event details and bug/feature reports from emails. If there is no explicit meeting proposed, set hasMeeting to false. If there is no bug/feature reported, set hasBugOrFeature to false.',
      prompt: `Analyze the following email and determine if it contains a meeting request, or if it reports a bug or feature request.\n\nFrom: ${from}\nTo: ${to}\n\n${content}`,
      schema: z.object({
        hasMeeting: z.boolean().describe('True if the email proposes or confirms a meeting, call, or event.'),
        title: z.string().optional().describe('A suitable title for the calendar event or linear issue.'),
        suggestedTime: z.string().optional().describe('The proposed date and time mentioned in the email, if any.'),
        durationMinutes: z.number().optional().describe('Estimated duration in minutes, default to 30 if not specified but a meeting exists.'),
        attendees: z.array(z.string()).optional().describe('List of email addresses or names that should attend.'),
        hasBugOrFeature: z.boolean().describe('True if the email reports a software bug, issue, or requests a new feature.')
      }),
    });

    return object;
  } catch (error) {
    console.error('Failed to detect smart chips:', error);
    return { hasMeeting: false, hasBugOrFeature: false };
  }
}

/**
 * 2. Meeting Intelligence
 * Extracts action items from an email thread after a calendar event ends
 * to help the user draft a follow-up email.
 */
export async function extractMeetingActionItems(threadContent: string) {
  const content = sanitizeLongText(threadContent, 3000);

  try {
    const { object } = await generateObject({
      model: openrouter('anthropic/claude-3.5-sonnet'),
      system: 'You are an executive assistant analyzing a post-meeting email thread to extract action items for a follow-up email.',
      prompt: `Extract the core action items from this meeting thread. Assign owners where explicitly mentioned.\n\nThread Context:\n${content}`,
      schema: z.object({
        actionItems: z.array(
          z.object({
            task: z.string().describe('The specific action to be taken.'),
            owner: z.string().describe('The person responsible for the action. Use "Unknown" if not specified.'),
            deadline: z.string().optional().describe('The deadline for the action, if mentioned.'),
          })
        ),
        summary: z.string().describe('A one-sentence summary of the meeting outcome.'),
      }),
    });

    return object;
  } catch (error) {
    console.error('Failed to extract meeting action items:', error);
    return { actionItems: [], summary: '' };
  }
}

/**
 * 3. Thread Decision Log
 * Takes a long email thread as input and collapses it into decisions made,
 * open questions, and action items with owners.
 */
export async function collapseThreadDecisionLog(threadContent: string) {
  const content = sanitizeLongText(threadContent, 5000);

  try {
    const { object } = await generateObject({
      model: openrouter('anthropic/claude-3.5-sonnet'),
      system: 'You are an intelligent summarization engine that distills long email threads into clear, structured decision logs for executives.',
      prompt: `Analyze the following email thread and collapse it into a structured decision log.\n\nThread Context:\n${content}`,
      schema: z.object({
        decisionsMade: z.array(z.string()).describe('List of clear decisions that were agreed upon in the thread.'),
        openQuestions: z.array(z.string()).describe('List of questions that remain unanswered or require further discussion.'),
        actionItems: z.array(
          z.object({
            task: z.string(),
            owner: z.string(),
          })
        ).describe('List of next steps and who is responsible for them.'),
        tlDr: z.string().describe('A very brief 2-3 sentence executive summary of the entire thread.'),
      }),
    });

    return object;
  } catch (error) {
    console.error('Failed to collapse thread decision log:', error);
    return null;
  }
}
