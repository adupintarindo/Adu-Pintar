"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ScoreTrackerProps {
  player1Name: string
  player1Score: number
  player2Name: string
  player2Score: number
  timeRemaining?: number
  totalQuestions?: number
  currentQuestion?: number
}

export function GameScoreTracker({
  player1Name,
  player1Score,
  player2Name,
  player2Score,
  timeRemaining,
  totalQuestions,
  currentQuestion,
}: ScoreTrackerProps) {
  const player1Ahead = player1Score > player2Score
  const scoreDiff = Math.abs(player1Score - player2Score)

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className={`border-2 ${player1Ahead ? "border-primary" : "border-border/40"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{player1Name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{player1Score}</div>
          </CardContent>
        </Card>

        <Card
          className={`border-2 ${!player1Ahead && player2Score > player1Score ? "border-accent" : "border-border/40"}`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{player2Name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{player2Score}</div>
          </CardContent>
        </Card>
      </div>

      {/* Score difference indicator */}
      <div className="mb-3 p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Perbedaan Skor</span>
          <span className="font-bold text-foreground">{scoreDiff} poin</span>
        </div>
        <div className="w-full bg-background rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all ${player1Ahead ? "bg-primary" : "bg-accent"}`}
            style={{
              width: `${player1Ahead ? 50 + Math.min(50, (scoreDiff / 1000) * 100) : Math.max(0, 50 - (scoreDiff / 1000) * 100)}%`,
              marginLeft: player1Ahead ? "0" : "auto",
            }}
          ></div>
        </div>
      </div>

      {/* Progress and timer */}
      {currentQuestion !== undefined && totalQuestions !== undefined && (
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 bg-primary/10 rounded-lg">
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="font-bold text-foreground">
              {currentQuestion}/{totalQuestions}
            </div>
          </div>
          {timeRemaining !== undefined && (
            <div className={`p-2 rounded-lg ${timeRemaining < 10 ? "bg-destructive/10" : "bg-muted"}`}>
              <div className="text-xs text-muted-foreground">Waktu</div>
              <div className={`font-bold ${timeRemaining < 10 ? "text-destructive" : "text-foreground"}`}>
                {timeRemaining}s
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
