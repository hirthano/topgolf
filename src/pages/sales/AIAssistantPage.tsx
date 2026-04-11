import React, { useState, useRef, useEffect, useCallback } from "react"
import { Send, Sparkles, Bot, User, Lightbulb } from "lucide-react"

import type { AIMessage } from "@/types"
import { aiResponses } from "@/data/mock-ai-responses"
import { generateId } from "@/lib/utils"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const SUGGESTION_CHIPS = [
  "What were our top 5 selling products last quarter?",
  "Which branch had the highest growth rate?",
  "Recommend a sales strategy for holiday season",
  "What golf equipment trends should we stock up on?",
  "Compare weekday vs weekend sales patterns",
  "Which product categories have declining sales?",
]

function matchResponse(input: string): string {
  const lower = input.toLowerCase()

  // Match against AI response patterns
  for (const template of aiResponses) {
    for (const pattern of template.questionPatterns) {
      if (lower.includes(pattern)) {
        return template.response
      }
    }
  }

  // Keyword-based fallback matches
  if (lower.includes('top') && (lower.includes('product') || lower.includes('selling'))) {
    return aiResponses.find(r => r.id === 'AI001')!.response
  }
  if (lower.includes('growth') || lower.includes('branch') || lower.includes('store')) {
    return aiResponses.find(r => r.id === 'AI003')!.response
  }
  if (lower.includes('holiday') || lower.includes('strategy') || lower.includes('season')) {
    return aiResponses.find(r => r.id === 'AI008')!.response
  }
  if (lower.includes('trend') || lower.includes('equipment') || lower.includes('stock')) {
    return aiResponses.find(r => r.id === 'AI009')!.response
  }
  if (lower.includes('weekday') || lower.includes('weekend') || lower.includes('pattern')) {
    return aiResponses.find(r => r.id === 'AI002')!.response
  }
  if (lower.includes('declining') || lower.includes('category') || lower.includes('mix')) {
    return aiResponses.find(r => r.id === 'AI010')!.response
  }

  // Generic fallback
  return `## Analysis

Thank you for your question. Based on our latest data across all 15 active Topgolf Indonesia branches:

### Key Highlights
- **Total MTD Revenue:** Trending above target with strong performance across premium locations
- **Top Performing Categories:** Golf Clubs lead revenue, while Fitting Services show the highest growth rate (+28% QoQ)
- **Branch Network:** SCBD Premier, Pondok Indah, and Plaza Indonesia continue to drive the majority of premium sales

### Quick Stats
| Metric | Value |
|--------|-------|
| Active Branches | 15 |
| Total Products | 50+ SKUs |
| Top Brand | MAJESTY (28% of revenue) |
| Fastest Growing | Fitting Services (+28%) |

> **Tip:** Try asking about specific topics like "top selling products", "branch performance", "revenue trends", or "product categories" for more detailed analysis.`
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-50 shrink-0">
        <Bot size={16} className="text-primary" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary-400" style={{ animation: 'typing-dot 1.4s infinite 0s' }} />
          <span className="h-2 w-2 rounded-full bg-primary-400" style={{ animation: 'typing-dot 1.4s infinite 0.2s' }} />
          <span className="h-2 w-2 rounded-full bg-primary-400" style={{ animation: 'typing-dot 1.4s infinite 0.4s' }} />
        </div>
      </div>
    </div>
  )
}

function renderMarkdown(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactElement[] = []
  let inTable = false
  let tableRows: string[][] = []
  let tableHeaders: string[] = []
  let inBlockquote = false
  let blockquoteLines: string[] = []

  function flushTable() {
    if (tableHeaders.length === 0) return
    elements.push(
      <div key={`table-${elements.length}`} className="overflow-x-auto my-3">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              {tableHeaders.map((h, i) => (
                <th key={i} className="text-left py-2 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  {h.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} className="border-b border-border-light">
                {row.map((cell, ci) => (
                  <td key={ci} className="py-1.5 px-3 text-foreground">
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableHeaders = []
    tableRows = []
    inTable = false
  }

  function flushBlockquote() {
    if (blockquoteLines.length === 0) return
    elements.push(
      <div key={`bq-${elements.length}`} className="my-3 border-l-4 border-gold bg-gold-50 rounded-r-lg px-4 py-3">
        <div className="flex items-start gap-2">
          <Lightbulb size={16} className="text-gold-600 shrink-0 mt-0.5" />
          <div className="text-sm text-foreground space-y-1">
            {blockquoteLines.map((l, i) => (
              <p key={i}>{renderInline(l)}</p>
            ))}
          </div>
        </div>
      </div>
    )
    blockquoteLines = []
    inBlockquote = false
  }

  function renderInline(text: string): React.ReactElement {
    // Bold: **text**
    const parts: (string | React.ReactElement)[] = []
    let remaining = text
    let keyIdx = 0
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index))
        }
        parts.push(<strong key={keyIdx++} className="font-semibold text-foreground">{boldMatch[1]}</strong>)
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      } else {
        parts.push(remaining)
        break
      }
    }
    return <>{parts}</>
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // End blockquote if not a > line
    if (inBlockquote && !line.startsWith('>')) {
      flushBlockquote()
    }

    // End table if not a | line
    if (inTable && !line.startsWith('|')) {
      flushTable()
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-sm font-bold text-foreground mt-4 mb-1">{line.slice(4)}</h4>
      )
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-base font-bold text-foreground mt-3 mb-1">{line.slice(3)}</h3>
      )
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      inBlockquote = true
      blockquoteLines.push(line.slice(2))
      continue
    }

    // Table
    if (line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim().length > 0)
      if (!inTable) {
        tableHeaders = cells
        inTable = true
        continue
      }
      // Skip separator row
      if (cells.every(c => c.trim().match(/^[-:]+$/))) continue
      tableRows.push(cells)
      continue
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex gap-2 my-0.5 pl-1">
          <span className="text-text-muted font-semibold text-sm shrink-0">{numMatch[1]}.</span>
          <span className="text-sm text-foreground">{renderInline(numMatch[2])}</span>
        </div>
      )
      continue
    }

    // Bullet list
    if (line.startsWith('- ')) {
      elements.push(
        <div key={`li-${i}`} className="flex gap-2 my-0.5 pl-1">
          <span className="text-primary mt-1.5 shrink-0">
            <svg width="6" height="6"><circle cx="3" cy="3" r="3" fill="currentColor" /></svg>
          </span>
          <span className="text-sm text-foreground">{renderInline(line.slice(2))}</span>
        </div>
      )
      continue
    }

    // Empty line
    if (line.trim() === '') {
      continue
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm text-foreground my-1">{renderInline(line)}</p>
    )
  }

  if (inBlockquote) flushBlockquote()
  if (inTable) flushTable()

  return <div className="space-y-0">{elements}</div>
}

export function AIAssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isTyping) return

    const userMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response delay
    setTimeout(() => {
      const responseContent = matchResponse(text)
      const aiMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 500 + Math.random() * 500)
  }, [isTyping])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleChipClick = (chip: string) => {
    sendMessage(chip)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 shrink-0">
        <PageHeader
          title="AI Sales Assistant"
          description="Ask questions about sales, products, branches, and market trends"
          actions={
            <div className="flex items-center gap-2 text-sm text-gold">
              <Sparkles size={16} />
              <span className="font-medium">Powered by AI</span>
            </div>
          }
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* Welcome state */}
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto animate-fade-in">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-50 mb-4">
              <Sparkles size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">How can I help you today?</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Ask me about sales performance, product analytics, branch comparisons, or market trends.
              I have access to all your Topgolf Indonesia data.
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTION_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  className="px-3 py-2 rounded-full border border-border bg-card text-sm text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary-200 transition-all card-hover"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-4 pt-2">
            {/* Persistent chips after conversation started */}
            {!isTyping && (
              <div className="flex flex-wrap gap-2 mb-4">
                {SUGGESTION_CHIPS.filter(c => !messages.some(m => m.content === c)).slice(0, 3).map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="px-2.5 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${
                  msg.role === 'user' ? 'bg-primary' : 'bg-primary-50'
                }`}>
                  {msg.role === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-primary" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] ${
                  msg.role === 'user'
                    ? 'rounded-2xl rounded-tr-sm bg-primary text-white px-4 py-3'
                    : 'rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    renderMarkdown(msg.content)
                  )}
                </div>
              </div>
            ))}

            {isTyping && <TypingIndicator />}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-border bg-card px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about sales, products, branches, trends..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button type="submit" disabled={!input.trim() || isTyping} className="gap-1.5 shrink-0">
            <Send size={16} />
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}
