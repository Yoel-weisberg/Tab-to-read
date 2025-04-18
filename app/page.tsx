"use client"

import { useState, useEffect, type KeyboardEvent, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, FileText, RefreshCw, Maximize, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

export default function IncrementalReader() {
  const [inputText, setInputText] = useState("")
  const [displayedText, setDisplayedText] = useState("")
  const [currentLine, setCurrentLine] = useState("")
  const [lines, setLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("input")
  const [isRTL, setIsRTL] = useState(true)
  const [isMarkdown, setIsMarkdown] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(true) // Default focus mode to true

  const readerRef = useRef<HTMLDivElement>(null)
  const fullscreenReaderRef = useRef<HTMLDivElement>(null)
  const currentLineRef = useRef<HTMLDivElement>(null)
  const fullscreenCurrentLineRef = useRef<HTMLDivElement>(null)

  // Process the input text into lines
  const processText = () => {
    if (!inputText.trim()) return

    // Split text by newlines and filter out empty lines
    const textLines = inputText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    setLines(textLines)
    setCurrentLineIndex(0)
    setDisplayedText("")
    setCurrentLine(textLines[0] || "")
    setActiveTab("reader")
    setIsFullscreen(true) // Automatically enter fullscreen mode when starting to read
  }

  // Handle keyboard events in the reader view
  const handleKeyDown = (e: KeyboardEvent) => {
    if (activeTab !== "reader" && !isFullscreen) return

    if (e.key === "Tab" || e.key === " ") {
      e.preventDefault() // Prevent default tab behavior

      if (currentLineIndex < lines.length) {
        // Add current line to displayed text
        if (displayedText) {
          setDisplayedText(displayedText + "\n" + currentLine)
        } else {
          setDisplayedText(currentLine)
        }

        // Move to next line
        const nextIndex = currentLineIndex + 1
        setCurrentLineIndex(nextIndex)

        // Set new current line if available
        if (nextIndex < lines.length) {
          setCurrentLine(lines[nextIndex])
        } else {
          setCurrentLine("")
        }
      }
    } else if (e.key === "Escape") {
      setIsFullscreen(false)
    }
  }

  // Reset the reader
  const resetReader = () => {
    setDisplayedText("")
    setCurrentLineIndex(0)
    setCurrentLine(lines[0] || "")
  }

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Focus the appropriate reader div
  useEffect(() => {
    if (activeTab === "reader") {
      if (isFullscreen && fullscreenReaderRef.current) {
        fullscreenReaderRef.current.focus()
      } else if (readerRef.current) {
        readerRef.current.focus()
      }
    }
  }, [activeTab, isFullscreen])

  // Auto-scroll to the current line when it changes
  useEffect(() => {
    if (currentLine) {
      // Use a small timeout to ensure the DOM has updated
      setTimeout(() => {
        if (isFullscreen && fullscreenCurrentLineRef.current) {
          fullscreenCurrentLineRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        } else if (currentLineRef.current) {
          currentLineRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
      }, 50)
    }
  }, [currentLine, isFullscreen])

  // Handle document-wide keyboard events for fullscreen mode
  useEffect(() => {
    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener("keydown", handleDocumentKeyDown as any)
    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown as any)
    }
  }, [isFullscreen])

  // Render the content with the current line highlighted using <mark>
  const renderContent = () => {
    if (isMarkdown) {
      return (
        <div>
          {displayedText && <ReactMarkdown>{displayedText}</ReactMarkdown>}
          {currentLine && (
            <mark ref={currentLineRef} className="block mt-2 font-bold">
              <ReactMarkdown>{currentLine}</ReactMarkdown>
            </mark>
          )}
        </div>
      )
    } else {
      return (
        <div className="whitespace-pre-line">
          {displayedText}
          {currentLine && (
            <mark ref={currentLineRef} className="block mt-2 font-bold">
              {currentLine}
            </mark>
          )}
        </div>
      )
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Incremental Text Reader</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Input Text
          </TabsTrigger>
          <TabsTrigger value="reader" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Reader
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle>Enter Your Text</CardTitle>
              <CardDescription>Paste or type the text you want to read incrementally.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Switch id="rtl-mode" checked={isRTL} onCheckedChange={setIsRTL} />
                  <Label htmlFor="rtl-mode">Right-to-Left Text</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="markdown-mode" checked={isMarkdown} onCheckedChange={setIsMarkdown} />
                  <Label htmlFor="markdown-mode">Markdown/README Format</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="focus-mode" checked={isFocusMode} onCheckedChange={setIsFocusMode} />
                  <Label htmlFor="focus-mode">Focus Mode (Dim Surroundings)</Label>
                </div>
              </div>

              <Textarea
                placeholder="Enter your text here..."
                className="min-h-[300px]"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                dir={isRTL ? "rtl" : "ltr"}
              />
              <Button className="mt-4 w-full" onClick={processText} disabled={!inputText.trim()}>
                Process Text
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reader">
          <Card>
            <CardHeader>
              <CardTitle>Reader</CardTitle>
              <CardDescription>
                Press the Tab key or Space bar to reveal the next line of text.
                {lines.length > 0 && (
                  <span className="block mt-1">
                    Progress: {currentLineIndex}/{lines.length} lines
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lines.length > 0 ? (
                <>
                  <div
                    ref={readerRef}
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    className="bg-white dark:bg-slate-900 p-4 rounded-md border min-h-[300px] focus:outline-none focus:ring-2 focus:ring-primary overflow-auto"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    {renderContent()}
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={resetReader} className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Reset
                    </Button>
                    <Button variant="outline" onClick={toggleFullscreen} className="flex items-center gap-2">
                      <Maximize className="h-4 w-4" />
                      Fullscreen
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No text to display. Please enter some text in the Input tab.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("input")}>
                    Go to Input
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fullscreen Reader */}
      {isFullscreen && lines.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Dimmed background overlay */}
          {isFocusMode && <div className="absolute inset-0 bg-black opacity-50"></div>}

          <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] mx-auto my-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl overflow-hidden">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={resetReader}
                className="h-8 w-8 rounded-full bg-white dark:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8 rounded-full bg-white dark:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-sm opacity-70">
              Progress: {currentLineIndex}/{lines.length} lines | Press Tab or Space to continue
            </div>

            <div
              ref={fullscreenReaderRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full h-full p-8 md:p-12 lg:p-16 overflow-auto focus:outline-none",
                "text-lg md:text-xl lg:text-2xl leading-relaxed md:leading-relaxed lg:leading-relaxed",
              )}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {isMarkdown ? (
                <div className="prose dark:prose-invert prose-lg md:prose-xl lg:prose-2xl max-w-none">
                  {displayedText && <ReactMarkdown>{displayedText}</ReactMarkdown>}
                  {currentLine && (
                    <mark ref={fullscreenCurrentLineRef} className="block mt-4 font-bold">
                      <ReactMarkdown>{currentLine}</ReactMarkdown>
                    </mark>
                  )}
                </div>
              ) : (
                <div>
                  <div className="whitespace-pre-line">{displayedText}</div>
                  {currentLine && (
                    <mark ref={fullscreenCurrentLineRef} className="block mt-4 font-bold">
                      {currentLine}
                    </mark>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

