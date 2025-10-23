# Product Overview

This is a React Native chat application built with Expo that provides an AI-powered conversational experience with advanced features.

## Core Features

- **AI Chat Interface**: Real-time chat with AI agent integration via n8n workflows
- **User Authentication**: Secure login/signup with Supabase Auth and persistent sessions
- **Cloud Storage**: Conversations and messages stored in Supabase with Row Level Security
- **Native Weather Cards**: Structured weather responses rendered as native React Native components
- **Text-to-Speech**: AI messages can be played as audio with caching and playback controls
- **Cross-Platform**: Runs on iOS, Android, and web via Expo

## Architecture

The app follows a modern React Native architecture with:
- Supabase backend for authentication and data storage
- n8n integration for AI agent workflows and external API calls
- Native widget rendering instead of web-based widgets for better performance
- Context-based state management for chat and authentication

## Target Platforms

- iOS (with tablet support)
- Android (with adaptive icons and edge-to-edge display)
- Web (static output)