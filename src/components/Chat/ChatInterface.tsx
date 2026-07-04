'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProgressEvent, ResearchData } from '@/types';
import ReportView from '../Report/ReportView';
import { ArrowUp, Plus, Settings } from 'lucide-react';
import styles from './Chat.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  data?: ResearchData;
  progress?: ProgressEvent[];
  error?: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<{id: string, name: string}[]>([]);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o');
  
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [serperKey, setSerperKey] = useState('');
  const [discordToken, setDiscordToken] = useState('');
  const [discordChannelId, setDiscordChannelId] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setModels(data);
          const defaultModel = data.find(m => m.id.includes('claude-3.5-sonnet') || m.id.includes('gpt-4o'));
          if (defaultModel) setSelectedModel(defaultModel.id);
          else if (data.length > 0) setSelectedModel(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToDiscord = async (data: ResearchData) => {
    if (!discordToken || !discordChannelId) return;

    try {
      const { generatePDFBlob } = await import('@/utils/pdf');
      const pdfBlob = generatePDFBlob(data);
      
      const formData = new FormData();
      formData.append('botToken', discordToken);
      formData.append('channelId', discordChannelId);
      formData.append('applicantName', applicantName);
      formData.append('applicantEmail', applicantEmail);
      formData.append('companyName', data.company.name);
      formData.append('companyWebsite', data.company.website || '');
      formData.append('file', pdfBlob);

      const res = await fetch('/api/discord', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        console.error('Failed to send to Discord');
      }
    } catch (err) {
      console.error('Discord submission error:', err);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput('');
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query };
    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = { id: botMsgId, role: 'assistant', progress: [] };
    
    setMessages(prev => [...prev, userMsg, botMsg]);
    setLoading(true);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: query, 
          model: selectedModel,
          openRouterKey: openRouterKey.trim() || undefined,
          serperKey: serperKey.trim() || undefined
        })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      let partialLine = '';
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = (partialLine + chunk).split('\n');
          partialLine = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.substring(6);
                if (!dataStr) continue;
                
                const data = JSON.parse(dataStr);
                
                setMessages(prev => prev.map(msg => {
                  if (msg.id === botMsgId) {
                    if (data.type === 'progress') {
                      return { ...msg, progress: [...(msg.progress || []), data.data] };
                    } else if (data.type === 'complete') {
                      // Trigger discord logic if keys are set
                      if (discordToken && discordChannelId) {
                        sendToDiscord(data.data);
                      }
                      return { ...msg, data: data.data };
                    } else if (data.type === 'error') {
                      return { ...msg, error: data.error };
                    }
                  }
                  return msg;
                }));
              } catch (e) {
                // Ignore incomplete JSON chunks
              }
            }
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, error: err.message || 'Connection failed' } : msg
      ));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleNewResearch = () => {
    setMessages([]);
    setInput('');
  };

  const renderProgress = (progress: ProgressEvent[]) => {
    if (!progress || progress.length === 0) return null;
    
    const stepMap = new Map<string, ProgressEvent>();
    progress.forEach(p => stepMap.set(p.step, p));
    const uniqueSteps = Array.from(stepMap.values());

    return (
      <div className={styles.researchingCard}>
        <h4 className={`${styles.researchTitle} font-mono uppercase`}>RESEARCH IN PROGRESS</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {uniqueSteps.map((p, i) => {
            let statusClass = styles.stepStatusPending;
            if (p.status === 'active') statusClass = styles.stepStatusActive;
            else if (p.status === 'completed') statusClass = styles.stepStatusDone;
            else if (p.status === 'error') statusClass = styles.stepStatusError;
            
            return (
              <div key={i} className={styles.stepItem}>
                <div className={statusClass}></div>
                <div>
                  {p.step}
                  {p.details && <span className={styles.stepDetails}>({p.details})</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.layout}>
      
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>AI-powered Company Research Assistant</div>
          <button className={styles.btnOutline} onClick={handleNewResearch} disabled={loading}>
            <span className={styles.goldPlus}>+</span> New Research
          </button>
        </div>
        
        <div className={styles.sidebarPanel}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Language Model</label>
            <select 
              className={styles.sidebarInput} 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={loading || models.length === 0}
            >
              {models.length === 0 ? <option value="openai/gpt-4o">Loading models...</option> : null}
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          
          {/* API Key Settings */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>OpenRouter API Key</label>
            <input 
              type="password" 
              placeholder="sk-or-v1-..." 
              className={styles.sidebarInput}
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Serper API Key</label>
            <input 
              type="password" 
              placeholder="Enter your key..." 
              className={styles.sidebarInput}
              value={serperKey}
              onChange={(e) => setSerperKey(e.target.value)}
            />
          </div>
          
          <div style={{ marginTop: '10px' }} className={styles.fieldLabel}>Applicant Details</div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Applicant Name</label>
            <input 
              type="text" 
              placeholder="Your Name" 
              className={styles.sidebarInput}
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Applicant Email</label>
            <input 
              type="email" 
              placeholder="Your Email" 
              className={styles.sidebarInput}
              value={applicantEmail}
              onChange={(e) => setApplicantEmail(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '10px' }} className={styles.fieldLabel}>Discord Bot Integration</div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Bot Token</label>
            <input 
              type="password" 
              placeholder="MTEy..." 
              className={styles.sidebarInput}
              value={discordToken}
              onChange={(e) => setDiscordToken(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Channel ID</label>
            <input 
              type="text" 
              placeholder="112233445566778899" 
              className={styles.sidebarInput}
              value={discordChannelId}
              onChange={(e) => setDiscordChannelId(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className={styles.mainArea}>
        <div className={styles.topbar}>
          <div className={styles.topbarTitle}>
            Company Research Assistant
            <div className={styles.liveBadge}>
              <div className={styles.liveDot}></div> LIVE
            </div>
          </div>
        </div>

        <div className={styles.contentArea}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <p>Enter a company name or website URL to generate a comprehensive research report using AI.</p>
            </div>
          )}
          
          {messages.map(msg => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className={styles.entryQueryBubble}>
                  {msg.content}
                </div>
              );
            } else {
              return (
                <React.Fragment key={msg.id}>
                  {msg.error ? (
                    <div className={styles.stepItem}>
                      <div className={styles.stepStatusError}></div>
                      <span style={{ color: 'var(--red)' }}>{msg.error}</span>
                    </div>
                  ) : msg.data ? (
                    <ReportView data={msg.data} />
                  ) : (
                    renderProgress(msg.progress || [])
                  )}
                </React.Fragment>
              );
            }
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.footerArea}>
          <form className={styles.inputRow} onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 'Stripe' or 'https://stripe.com'"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button type="submit" className={styles.submitBtn} disabled={loading || !input.trim()}>
              <ArrowUp size={20} />
            </button>
          </form>
          <div className={styles.helperText}>
            AI models can make mistakes. Verify important information.
          </div>
        </div>
      </div>

    </div>
  );
}
