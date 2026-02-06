"use client"

import * as React from "react"
import {
  Camera,
  CameraOff,
  Check,
  X,
  AlertTriangle,
  User,
  Mail,
  Hash,
  Users,
  RefreshCw,
  Keyboard,
  SwitchCamera,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@workspace/ui/components/select"
import {
  validateTicket,
  redeemTicket,
  type TicketValidationResult,
} from "@/lib/tickets"

type ScanState = "idle" | "scanning" | "paused" | "validating" | "success" | "error"
type CameraPermissionState = "prompt" | "granted" | "denied" | "unavailable"

interface CameraDevice {
  deviceId: string
  label: string
}

interface TicketStats {
  totalQuantity: number
  totalRedeemed: number
  totalRemaining: number
  percentageRedeemed: number
}

export function ScannerClient() {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const scanIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const [cameraActive, setCameraActive] = React.useState(false)
  const [cameraError, setCameraError] = React.useState<string | null>(null)
  const [cameraPermission, setCameraPermission] =
    React.useState<CameraPermissionState>("prompt")
  const [availableCameras, setAvailableCameras] = React.useState<CameraDevice[]>([])
  const [selectedCamera, setSelectedCamera] = React.useState<string>("")
  const [isSecureContext, setIsSecureContext] = React.useState(true)

  const [scanState, setScanState] = React.useState<ScanState>("idle")
  const [manualCode, setManualCode] = React.useState("")
  const [validationResult, setValidationResult] =
    React.useState<TicketValidationResult | null>(null)
  const [guestsToAdmit, setGuestsToAdmit] = React.useState(1)

  // Stats from database
  const [stats, setStats] = React.useState<TicketStats | null>(null)
  const [statsLoading, setStatsLoading] = React.useState(true)

  // Load stats from database
  async function loadStats() {
    try {
      const response = await fetch("/api/tickets/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error("Failed to load stats:", err)
    } finally {
      setStatsLoading(false)
    }
  }

  // Load stats on mount and after successful redeem
  React.useEffect(() => {
    loadStats()
  }, [])

  // Check if we're in a secure context (HTTPS or localhost)
  React.useEffect(() => {
    const secure =
      typeof window !== "undefined" &&
      (window.isSecureContext ||
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
    setIsSecureContext(secure)

    if (!secure) {
      setCameraError(
        "Kamera-Zugriff erfordert HTTPS. Bitte nutze eine sichere Verbindung."
      )
      setCameraPermission("unavailable")
    }
  }, [])

  // Check camera permission on mount
  React.useEffect(() => {
    async function checkPermission() {
      if (!isSecureContext) return

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission("unavailable")
        setCameraError(
          "Kamera wird von diesem Browser nicht unterstützt. Bitte verwende einen modernen Browser."
        )
        return
      }

      try {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const result = await navigator.permissions.query({
              name: "camera" as PermissionName,
            })
            setCameraPermission(result.state as CameraPermissionState)

            result.addEventListener("change", () => {
              setCameraPermission(result.state as CameraPermissionState)
            })
          } catch {
            // permissions.query for camera not supported
          }
        }
      } catch (err) {
        console.debug("Permission check error:", err)
      }
    }

    checkPermission()
  }, [isSecureContext])

  async function enumerateCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label:
            device.label ||
            `Kamera ${index + 1}${device.deviceId.includes("back") || device.deviceId.includes("environment") ? " (Rückseite)" : ""}`,
        }))

      setAvailableCameras(videoDevices)

      const backCamera = videoDevices.find(
        (d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rück") ||
          d.label.toLowerCase().includes("environment") ||
          d.deviceId.includes("back")
      )

      if (backCamera) {
        setSelectedCamera(backCamera.deviceId)
      } else if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId)
      }

      return videoDevices
    } catch (err) {
      console.error("Error enumerating cameras:", err)
      return []
    }
  }

  async function startCamera() {
    setCameraError(null)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Kamera-API nicht verfügbar. Bitte verwende einen modernen Browser (Chrome, Safari, Firefox)."
      )
      return
    }

    try {
      const initialConstraints: MediaStreamConstraints = {
        video: true,
        audio: false,
      }

      let stream: MediaStream

      try {
        stream = await navigator.mediaDevices.getUserMedia(initialConstraints)
        stream.getTracks().forEach((track) => track.stop())
      } catch (err) {
        handleCameraError(err)
        return
      }

      const cameras = await enumerateCameras()

      const constraints: MediaStreamConstraints = {
        video: {
          ...(selectedCamera
            ? { deviceId: { exact: selectedCamera } }
            : { facingMode: { ideal: "environment" } }),
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch {
        console.debug("Falling back to simpler constraints")
        stream = await navigator.mediaDevices.getUserMedia({
          video: selectedCamera
            ? { deviceId: selectedCamera }
            : { facingMode: "environment" },
          audio: false,
        })
      }

      streamRef.current = stream
      setCameraActive(true)
      setCameraPermission("granted")

      // Wait for next render cycle before setting video source
      await new Promise((resolve) => setTimeout(resolve, 100))

      if (videoRef.current) {
        const video = videoRef.current
        video.srcObject = stream
        video.setAttribute("playsinline", "true")
        video.setAttribute("webkit-playsinline", "true")
        video.muted = true

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const onLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            video
              .play()
              .then(() => {
                console.log("Video playing, dimensions:", video.videoWidth, "x", video.videoHeight)
                resolve()
              })
              .catch((err) => {
                console.error("Video play failed:", err)
                reject(err)
              })
          }
          
          video.addEventListener("loadedmetadata", onLoadedMetadata)
          video.onerror = () => reject(new Error("Video loading failed"))
          
          // Fallback timeout
          setTimeout(() => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            // Try to play anyway
            video.play().catch(() => {})
            resolve()
          }, 3000)
        })
      }

      setScanState("scanning")
      startScanning()

      toast.success("Kamera gestartet", {
        description:
          cameras.length > 1
            ? `${cameras.length} Kameras verfügbar`
            : "Bereit zum Scannen",
      })
    } catch (err) {
      handleCameraError(err)
    }
  }

  function handleCameraError(err: unknown) {
    console.error("Camera error:", err)

    const error = err as Error & { name?: string }
    let message = "Kamera konnte nicht gestartet werden."

    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      message =
        "Kamera-Berechtigung verweigert. Bitte erlaube den Kamera-Zugriff in deinen Browser-Einstellungen."
      setCameraPermission("denied")
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      message = "Keine Kamera gefunden. Bitte schließe eine Kamera an."
    } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      message =
        "Kamera wird bereits von einer anderen App verwendet. Bitte schließe andere Apps, die die Kamera nutzen."
    } else if (error.name === "OverconstrainedError") {
      message =
        "Die gewählte Kamera unterstützt die Anforderungen nicht. Versuche eine andere Kamera."
    } else if (error.name === "SecurityError") {
      message =
        "Kamera-Zugriff aus Sicherheitsgründen blockiert. Bitte nutze HTTPS."
    } else if (error.name === "AbortError") {
      message = "Kamera-Start wurde abgebrochen. Bitte versuche es erneut."
    } else if (error.message) {
      message = `Kamera-Fehler: ${error.message}`
    }

    setCameraError(message)
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setScanState("idle")
  }

  async function switchCamera(deviceId: string) {
    setSelectedCamera(deviceId)
    if (cameraActive) {
      stopCamera()
      setTimeout(() => {
        startCamera()
      }, 100)
    }
  }

  function startScanning() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    scanIntervalRef.current = setInterval(() => {
      // Only scan when in scanning state (not paused, validating, etc.)
      if (scanState !== "scanning") return
      scanFrame()
    }, 300)
  }

  function pauseScanning() {
    setScanState("paused")
  }

  function resumeScanning() {
    setScanState("scanning")
  }

  async function scanFrame() {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    if ("BarcodeDetector" in window) {
      try {
        // @ts-expect-error - BarcodeDetector is not in TypeScript types yet
        const detector = new window.BarcodeDetector({
          formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "pdf417"],
        })
        const barcodes = await detector.detect(canvas)

        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue
          if (code) {
            handleCodeDetected(code)
          }
        }
      } catch (err) {
        console.debug("BarcodeDetector error:", err)
      }
    }
  }

  async function handleCodeDetected(code: string) {
    // Immediately pause scanning to prevent multiple detections
    pauseScanning()

    // Vibrate if supported (for haptic feedback)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    // Play a sound
    try {
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.value = 800
      oscillator.type = "sine"
      gainNode.gain.value = 0.1
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch {
      // Audio not supported
    }

    await validateAndShowResult(code)
  }

  async function validateAndShowResult(code: string) {
    setScanState("validating")
    setManualCode("")

    try {
      const result = await validateTicket(code)
      setValidationResult(result)

      if (result.valid) {
        setScanState("success")
        if (result.remainingQuantity) {
          setGuestsToAdmit(Math.min(1, result.remainingQuantity))
        }
      } else {
        setScanState("error")
      }
    } catch (err) {
      console.error("Validation error:", err)
      setScanState("error")
      setValidationResult({
        valid: false,
        error: "Verbindungsfehler",
        code,
      })
    }
  }

  async function handleRedeem() {
    if (!validationResult?.code) return

    setScanState("validating")

    try {
      const result = await redeemTicket(validationResult.code, guestsToAdmit)

      if (result.success) {
        toast.success(`${result.redeemedNow} Gast/Gäste eingelassen`, {
          description: `Ticket: ${result.code}`,
        })
        // Reload stats after successful redeem
        loadStats()
        resetScanner()
      } else {
        toast.error("Einlösung fehlgeschlagen", {
          description: result.error,
        })
        setScanState("error")
      }
    } catch (err) {
      console.error("Redeem error:", err)
      toast.error("Verbindungsfehler")
      setScanState("error")
    }
  }

  function resetScanner() {
    setScanState("scanning")
    setValidationResult(null)
    setGuestsToAdmit(1)
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (manualCode.trim()) {
      // Pause scanning when manually entering code
      pauseScanning()
      validateAndShowResult(manualCode.trim().toUpperCase())
    }
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Update scanning interval when scanState changes
  React.useEffect(() => {
    if (cameraActive && scanState === "scanning") {
      startScanning()
    }
  }, [scanState, cameraActive])

  return (
    <div className="p-6 space-y-6">
      {/* HTTPS Warning */}
      {!isSecureContext && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">
                Unsichere Verbindung
              </p>
              <p className="text-sm text-destructive/80">
                Kamera-Zugriff erfordert HTTPS. Bitte nutze eine sichere
                Verbindung oder localhost.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Card from Database */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Eingecheckt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statsLoading ? (
            <div className="h-8 w-24 animate-pulse bg-muted/50 rounded" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight text-green-500">
                    {stats?.totalRedeemed ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {stats?.totalQuantity ?? 0}
                  </span>
                </div>
                {stats && stats.totalQuantity > 0 && (
                  <span className="text-xs font-medium text-green-500">
                    +{((stats.totalRedeemed / stats.totalQuantity) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="flex gap-1 w-full">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-4 flex-1 rounded-sm transition-colors ${
                      i < Math.round(((stats?.totalRedeemed ?? 0) / (stats?.totalQuantity || 1)) * 24)
                        ? "bg-green-500"
                        : "bg-muted/30"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner Section */}
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Ticket Scanner
            </CardTitle>
            <CardDescription className="text-xs">
              Scanne den Barcode oder QR-Code auf dem Ticket
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera View */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    webkit-playsinline="true"
                    muted
                    autoPlay
                    onLoadedData={(e) => {
                      const video = e.currentTarget
                      console.log("Video loaded, playing...")
                      video.play().catch(console.error)
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Scan overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`w-64 h-40 border-2 rounded-lg relative transition-colors ${
                      scanState === "scanning" ? "border-primary" : "border-muted-foreground/50"
                    }`}>
                      <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 transition-colors ${
                        scanState === "scanning" ? "border-primary" : "border-muted-foreground/50"
                      }`} />
                      <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 transition-colors ${
                        scanState === "scanning" ? "border-primary" : "border-muted-foreground/50"
                      }`} />
                      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 transition-colors ${
                        scanState === "scanning" ? "border-primary" : "border-muted-foreground/50"
                      }`} />
                      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 transition-colors ${
                        scanState === "scanning" ? "border-primary" : "border-muted-foreground/50"
                      }`} />
                      {scanState === "scanning" && (
                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary animate-pulse" />
                      )}
                    </div>
                  </div>
                  {/* Status indicator */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        scanState === "scanning"
                          ? "default"
                          : scanState === "validating"
                            ? "secondary"
                            : scanState === "paused"
                              ? "outline"
                              : "outline"
                      }
                    >
                      {scanState === "scanning"
                        ? "Scanne..."
                        : scanState === "validating"
                          ? "Prüfe..."
                          : scanState === "paused"
                            ? "Pausiert"
                            : "Bereit"}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
                  <CameraOff className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    {cameraPermission === "denied"
                      ? "Kamera-Berechtigung verweigert"
                      : cameraPermission === "unavailable"
                        ? "Kamera nicht verfügbar"
                        : "Kamera nicht aktiv"}
                  </p>
                  {cameraError && (
                    <p className="text-sm text-destructive text-center">
                      {cameraError}
                    </p>
                  )}
                  {cameraPermission === "denied" && (
                    <p className="text-xs text-muted-foreground text-center">
                      Öffne die Browser-Einstellungen und erlaube den
                      Kamera-Zugriff für diese Seite.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex gap-2">
              {cameraActive ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={stopCamera}
                  >
                    <CameraOff className="mr-2 h-4 w-4" />
                    Stoppen
                  </Button>
                  {availableCameras.length > 1 && (
                    <Select
                      value={selectedCamera}
                      onValueChange={switchCamera}
                    >
                      <SelectTrigger className="w-auto">
                        <SwitchCamera className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCameras.map((camera) => (
                          <SelectItem
                            key={camera.deviceId}
                            value={camera.deviceId}
                          >
                            {camera.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              ) : (
                <Button
                  className="flex-1"
                  onClick={startCamera}
                  disabled={
                    cameraPermission === "unavailable" || !isSecureContext
                  }
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Kamera starten
                </Button>
              )}
            </div>

            <Separator />

            {/* Manual Input */}
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Manuelle Eingabe
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ticket-Code eingeben..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button type="submit" disabled={!manualCode.trim()}>
                  Prüfen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Scan-Ergebnis</CardTitle>
            <CardDescription className="text-xs">
              Ticket-Details und Einlass-Kontrolle
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validationResult ? (
              <div className="space-y-4">
                {/* Status Banner */}
                <div
                  className={`p-4 rounded-lg flex items-center gap-3 ${
                    validationResult.valid
                      ? validationResult.fullyRedeemed
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-green-500/10 text-green-500"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {validationResult.valid ? (
                    validationResult.fullyRedeemed ? (
                      <>
                        <AlertTriangle className="h-6 w-6 shrink-0" />
                        <div>
                          <p className="font-semibold">Bereits eingelöst</p>
                          <p className="text-sm opacity-80">
                            Dieses Ticket wurde bereits vollständig verwendet
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Check className="h-6 w-6 shrink-0" />
                        <div>
                          <p className="font-semibold">Ticket gültig</p>
                          <p className="text-sm opacity-80">
                            {validationResult.remainingQuantity} Platz/Plätze
                            verfügbar
                          </p>
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <X className="h-6 w-6 shrink-0" />
                      <div>
                        <p className="font-semibold">Ticket ungültig</p>
                        <p className="text-sm opacity-80">
                          {validationResult.error}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Ticket Details */}
                {validationResult.valid && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Code:</span>
                      <code className="font-mono bg-muted px-2 py-0.5 rounded">
                        {validationResult.code}
                      </code>
                    </div>

                    {validationResult.customerName && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Name:</span>
                        <span>{validationResult.customerName}</span>
                      </div>
                    )}

                    {validationResult.customerEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">E-Mail:</span>
                        <span>{validationResult.customerEmail}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Plätze:</span>
                      <span>
                        {validationResult.redeemedCount} /{" "}
                        {validationResult.quantity} eingelöst
                      </span>
                    </div>

                    <Separator />

                    {/* Admission Controls */}
                    {!validationResult.fullyRedeemed && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium">
                          Gäste einlassen:
                        </label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setGuestsToAdmit(Math.max(1, guestsToAdmit - 1))
                            }
                            disabled={guestsToAdmit <= 1}
                          >
                            -
                          </Button>
                          <div className="w-16 text-center text-2xl font-bold">
                            {guestsToAdmit}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setGuestsToAdmit(
                                Math.min(
                                  validationResult.remainingQuantity!,
                                  guestsToAdmit + 1
                                )
                              )
                            }
                            disabled={
                              guestsToAdmit >=
                              (validationResult.remainingQuantity ?? 1)
                            }
                          >
                            +
                          </Button>
                        </div>

                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleRedeem}
                          disabled={scanState === "validating"}
                        >
                          <Check className="mr-2 h-5 w-5" />
                          {guestsToAdmit} Gast/Gäste einlassen
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Reset Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetScanner}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Neuer Scan
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">
                  Scanne ein Ticket oder gib den Code manuell ein
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
