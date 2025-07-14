// src\app\api\chat\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Our database connection
import { messages, conversations, users } from '@/drizzle/schema'; // Database table schemas
import ollama from 'ollama'; // For interacting with the Ollama AI model
import { v4 as uuidv4 } from 'uuid'; // Generates unique IDs (UUIDs)
import { eq } from 'drizzle-orm'; // Drizzle ORM utility for equality checks in queries

/**
 * Handles POST requests for chat messages.
 * This API route receives a user message and an optional conversation ID.
 * It then saves the user's message, gets a reply from Ollama,
 * and saves the AI's reply, returning it to the client.
 */
export async function POST(req: NextRequest) {
  // Extract conversationId (if provided) and the user's message from the request body
  const { conversationId: clientConversationId, userMessage } = await req.json();

  let currentConversationId: string;
  let currentUserId: string; // This would typically come from an authentication system

  // --- Determine or Create User and Conversation ---
  // If the client doesn't provide a conversationId, it means this is a brand new chat session.
  // In this case, we create a new anonymous user and a new conversation.
  // If a conversationId IS provided, we assume it's an ongoing chat.
  // (In a real application, you'd verify if this ID is valid and belongs to the current authenticated user.)
  if (!clientConversationId) {
    // No conversation ID means a new session:
    currentUserId = uuidv4(); // Generate a fresh unique ID for the new user
    currentConversationId = uuidv4(); // Generate a fresh unique ID for the new conversation

    try {
      // 1. Create a new anonymous user in the database
      await db.insert(users).values({
        id: currentUserId,
        name: 'Anonymous User', // In a production app, integrate with user authentication here
      });

      // 2. Create a new conversation linked to this user
      await db.insert(conversations).values({
        id: currentConversationId,
        userId: currentUserId, // Link the conversation to the new user
        title: `Chat Session - ${new Date().toLocaleString()}`, // A simple timestamped title
      });
    } catch (error) {
      console.error('Error creating new user or conversation:', error);
      // Send an error response if database insertion fails
      return NextResponse.json({ error: 'Failed to start new chat session.' }, { status: 500 });
    }
  } else {
    // A conversation ID was provided, so we continue the existing chat
    currentConversationId = clientConversationId;

    // --- IMPORTANT: Production systems would add robust validation here ---
    // In a real app, you'd fetch the conversation to confirm it exists and
    // ensure the current authenticated user has access to it.
    // Example (uncomment and adapt if needed):
    
    const existingConversation = await db.select()
      .from(conversations)
      .where(eq(conversations.id, currentConversationId))
      .limit(1);

    if (existingConversation.length === 0) {
      console.error('Provided conversationId does not exist:', clientConversationId);
      return NextResponse.json({ error: 'Invalid conversation ID.' }, { status: 404 });
    }
    // If you need the userId from the existing conversation:
    currentUserId = existingConversation[0].userId;
    
  }

  // --- Save User's Message to Database ---
  try {
    await db.insert(messages).values({
      conversationId: currentConversationId, // Associate message with the correct conversation
      role: 'user', // Mark this message as from the user
      content: userMessage,
    });
  } catch (error) {
    console.error('Error saving user message to database:', error);
    // Send an error response if saving the user's message fails
    return NextResponse.json({ error: 'Failed to save your message.' }, { status: 500 });
  }

  // --- Get AI Response from Ollama ---
  let aiMessage = 'Sorry, I could not get a response from the AI. Please try again later.'; // Default error message

  try {
    const completion = await ollama.chat({
      model: 'gemma3', // The AI model to use
      messages: [{ role: 'user', content: userMessage }], // Send only the latest user message
    });
    aiMessage = completion.message.content;
  } catch (ollamaError) {
    console.error('Error calling Ollama AI:', ollamaError);
    // The `aiMessage` will remain the default error message if Ollama fails
  }

  // --- Save AI's Reply to Database ---
  try {
    await db.insert(messages).values({
      conversationId: currentConversationId, // Associate AI reply with the conversation
      role: 'assistant', // Mark this message as from the AI assistant
      content: aiMessage, // Use the AI's response (or the default error message)
    });
  } catch (error) {
    console.error('Error saving AI reply to database:', error);
    // Log the error but don't prevent the response from being sent to the client,
    // as the AI message itself might still be useful.
  }

  // --- Send Response to Client ---
  // Return the AI's reply and the conversation ID (useful for subsequent messages)
  return NextResponse.json({ reply: aiMessage, conversationId: currentConversationId });
}