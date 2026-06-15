#Requires AutoHotkey v2.0
#SingleInstance Force

ServerURL := "http://127.0.0.1:8000/action"

SendCommand(key) {
    global ServerURL
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        whr.Open("POST", ServerURL "?key=" key, false)
        whr.Send()
    }
}

; === Controles de Movimiento (W, A, S, D) ===
KeysDown := Map()
KeysDown["w"] := 0
KeysDown["a"] := 0
KeysDown["s"] := 0
KeysDown["d"] := 0

IsCurrentlyWalking := 0

SendWalkStart() {
    SendCommand("walk_start")
}

UpdateWalkState() {
    global KeysDown, IsCurrentlyWalking
    wantsWalk := KeysDown["w"] || KeysDown["a"] || KeysDown["s"] || KeysDown["d"]
    if (wantsWalk && !IsCurrentlyWalking) {
        IsCurrentlyWalking := 1
        SendCommand("walk_start")
        SetTimer(SendWalkStart, 200)
    } else if (!wantsWalk && IsCurrentlyWalking) {
        IsCurrentlyWalking := 0
        SetTimer(SendWalkStart, 0)
        SendCommand("walk_stop")
    }
}

~w:: {
    global KeysDown
    if (!KeysDown["w"]) {
        KeysDown["w"] := 1
        UpdateWalkState()
    }
}
~w up:: {
    global KeysDown
    KeysDown["w"] := 0
    UpdateWalkState()
}

~a:: {
    global KeysDown
    if (!KeysDown["a"]) {
        KeysDown["a"] := 1
        UpdateWalkState()
    }
}
~a up:: {
    global KeysDown
    KeysDown["a"] := 0
    UpdateWalkState()
}

~s:: {
    global KeysDown
    if (!KeysDown["s"]) {
        KeysDown["s"] := 1
        UpdateWalkState()
    }
}
~s up:: {
    global KeysDown
    KeysDown["s"] := 0
    UpdateWalkState()
}

~d:: {
    global KeysDown
    if (!KeysDown["d"]) {
        KeysDown["d"] := 1
        UpdateWalkState()
    }
}
~d up:: {
    global KeysDown
    KeysDown["d"] := 0
    UpdateWalkState()
}
