-- Configuración de 6 Frames (Esquina inferior derecha en cuadrícula 3x2)
local frames = {}
local textures = {}
local timers = {}
local numFrames = 6

for i = 1, numFrames do
    local row = math.floor((i-1) / 3)
    local col = (i-1) % 3
    
    local f = CreateFrame("Frame", "GiftuberHelperFrame" .. i, UIParent)
    f:SetSize(12, 12)
    -- Columnas con separación de 15px, filas con separación de 15px
    f:SetPoint("BOTTOMRIGHT", UIParent, "BOTTOMRIGHT", -col * 15, row * 15)
    f:SetFrameStrata("TOOLTIP")
    
    local tex = f:CreateTexture(nil, "BACKGROUND")
    tex:SetAllPoints(f)
    tex:SetColorTexture(0, 0, 0, 1) -- Fondo negro permanente para tapar el juego
    
    frames[i] = f
    textures[i] = tex
end

local nextFrame = 1

local function ShowColor(r, g, b)
    local idx = nextFrame
    textures[idx]:SetColorTexture(r, g, b, 1)
    
    if timers[idx] then timers[idx]:Cancel() end
    timers[idx] = C_Timer.NewTimer(0.5, function()
        textures[idx]:SetColorTexture(0, 0, 0, 1) -- Volver a negro puro
    end)
    
    nextFrame = nextFrame + 1
    if nextFrame > numFrames then
        nextFrame = 1
    end
end

-- Configuración de Colores y Hechizos por defecto
local colorRGB = {
    red = {1, 0, 0},
    green = {0, 1, 0},
    blue = {0, 0, 1},
    yellow = {1, 1, 0},
    cyan = {0, 1, 1},
    magenta = {1, 0, 1},
    orange = {1, 0.5, 0},
    purple = {0.5, 0, 1},
    lime = {0.5, 1, 0},
    pink = {1, 0.5, 0.75}
}

local defaultSettings = {
    red = "cruzado, crusader, sentencia, judgment",
    green = "gloria, glory, imposic, hands, destello, flash, luz sagrada, holy light, choque sagrado, holy shock, alba, dawn, escudo de hon, escudo del hon, righteous, holy shield",
    blue = "consagr, consecrat",
    yellow = "colera, cólera, wrath, sentinel, sentinela, crusade",
    cyan = "",
    magenta = "",
    orange = "",
    purple = "divine toll, estropicio",
    lime = "vengador, avenger, escudo de veng, escudo del veng",
    pink = ""
}

-- Definición del Panel de Configuración
local selectedColorKey = "red"
local colorButtons = {}

local function SelectColor(key)
    selectedColorKey = key
    if not GiftuberHelperConfigFrame then return end
    
    for _, btn in ipairs(colorButtons) do
        if btn.colorKey == key then
            btn:SetBackdropBorderColor(1, 0.8, 0, 1) -- Borde dorado para el seleccionado
        else
            btn:SetBackdropBorderColor(0.2, 0.2, 0.2, 0.8)
        end
    end
    
    local text = GiftuberHelperDB and GiftuberHelperDB[key] or ""
    GiftuberHelperConfigFrame.editBox:SetText(text)
    GiftuberHelperConfigFrame.colorTitle:SetText("Hechizos para: " .. key:upper())
    local rgb = colorRGB[key]
    if rgb then
        GiftuberHelperConfigFrame.colorPreview:SetColorTexture(rgb[1], rgb[2], rgb[3], 1)
    end
end

local function CreateConfigMenu()
    if GiftuberHelperConfigFrame then return end

    local f = CreateFrame("Frame", "GiftuberHelperConfigFrame", UIParent, "BackdropTemplate")
    f:SetSize(450, 380)
    f:SetPoint("CENTER")
    f:SetMovable(true)
    f:EnableMouse(true)
    f:RegisterForDrag("LeftButton")
    f:SetScript("OnDragStart", function(self) self:StartMoving() end)
    f:SetScript("OnDragStop", function(self) self:StopMovingOrSizing() end)
    f:SetScript("OnHide", function(self) if self.editBox then self.editBox:ClearFocus() end end)
    f:SetFrameStrata("HIGH")

    -- Estilo del panel
    f:SetBackdrop({
        bgFile = "Interface\\ChatFrame\\ChatFrameBackground",
        edgeFile = "Interface\\Tooltips\\UI-Tooltip-Border",
        tile = true, tileSize = 16, edgeSize = 16,
        insets = { left = 4, right = 4, top = 4, bottom = 4 }
    })
    f:SetBackdropColor(0.08, 0.08, 0.12, 0.95)
    f:SetBackdropBorderColor(0.8, 0.6, 0.1, 1)

    -- Título
    local title = f:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
    title:SetPoint("TOP", f, "TOP", 0, -15)
    title:SetText("Giftuber Helper - Configuración")

    -- Botón de cerrar
    local closeBtn = CreateFrame("Button", nil, f, "UIPanelCloseButton")
    closeBtn:SetPoint("TOPRIGHT", f, "TOPRIGHT", -5, -5)

    -- Instrucciones
    local desc = f:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
    desc:SetPoint("TOP", title, "BOTTOM", 0, -5)
    desc:SetText("Escribe palabras clave separadas por comas (ej: sentencia, cruzado)")

    -- Preview de Color Activo
    local previewTex = f:CreateTexture(nil, "OVERLAY")
    previewTex:SetSize(18, 18)
    previewTex:SetPoint("TOPLEFT", f, "TOPLEFT", 150, -50)
    f.colorPreview = previewTex

    local colorTitle = f:CreateFontString(nil, "OVERLAY", "GameFontNormal")
    colorTitle:SetPoint("LEFT", previewTex, "RIGHT", 8, 0)
    colorTitle:SetText("Hechizos para:")
    f.colorTitle = colorTitle

    -- ScrollFrame y EditBox para los hechizos
    local scrollFrame = CreateFrame("ScrollFrame", "GiftuberConfigScrollFrame", f, "UIPanelScrollFrameTemplate")
    scrollFrame:SetSize(260, 200)
    scrollFrame:SetPoint("TOPLEFT", f, "TOPLEFT", 150, -80)

    local editBox = CreateFrame("EditBox", "GiftuberConfigEditBox", scrollFrame)
    editBox:SetMultiLine(true)
    editBox:SetMaxLetters(9999)
    editBox:SetWidth(240)
    editBox:SetHeight(200)
    editBox:SetFontObject("ChatFontNormal")
    editBox:SetAutoFocus(false)
    editBox:SetScript("OnEscapePressed", function(self) self:ClearFocus() end)
    scrollFrame:SetScrollChild(editBox)
    f.editBox = editBox

    -- Fondo del EditBox (Hacerlo clicable para enfocar el editbox vacío)
    local editBg = CreateFrame("Frame", nil, f, "BackdropTemplate")
    editBg:SetPoint("TOPLEFT", scrollFrame, "TOPLEFT", -8, 8)
    editBg:SetPoint("BOTTOMRIGHT", scrollFrame, "BOTTOMRIGHT", 24, -8)
    editBg:SetBackdrop({
        bgFile = "Interface\\ChatFrame\\ChatFrameBackground",
        edgeFile = "Interface\\Tooltips\\UI-Tooltip-Border",
        edgeSize = 8,
        insets = { left = 2, right = 2, top = 2, bottom = 2 }
    })
    editBg:SetBackdropColor(0, 0, 0, 0.6)
    editBg:SetBackdropBorderColor(0.4, 0.4, 0.4, 1)
    editBg:EnableMouse(true)
    editBg:SetScript("OnMouseDown", function() editBox:SetFocus() end)

    -- Permitir que el ScrollFrame también pase el foco al hacer clic
    scrollFrame:EnableMouse(true)
    scrollFrame:SetScript("OnMouseDown", function() editBox:SetFocus() end)

    -- Botón de Guardar
    local saveBtn = CreateFrame("Button", nil, f, "UIPanelButtonTemplate")
    saveBtn:SetSize(120, 28)
    saveBtn:SetPoint("BOTTOMRIGHT", f, "BOTTOMRIGHT", -20, 15)
    saveBtn:SetText("Guardar Hechizos")
    saveBtn:SetScript("OnClick", function()
        if GiftuberHelperDB and selectedColorKey then
            GiftuberHelperDB[selectedColorKey] = editBox:GetText()
            editBox:ClearFocus()
            print("|cff00ff00[Giftuber Helper]|r Guardado para " .. selectedColorKey:upper())
        end
    end)

    -- Lista de Botones de Colores en la izquierda
    local colorKeys = {"red", "green", "blue", "yellow", "cyan", "magenta", "orange", "purple", "lime", "pink"}
    local yOffset = -50
    for _, k in ipairs(colorKeys) do
        local btn = CreateFrame("Button", nil, f, "BackdropTemplate")
        btn:SetSize(120, 24)
        btn:SetPoint("TOPLEFT", f, "TOPLEFT", 15, yOffset)
        btn.colorKey = k
        
        btn:SetBackdrop({
            bgFile = "Interface\\ChatFrame\\ChatFrameBackground",
            edgeFile = "Interface\\Tooltips\\UI-Tooltip-Border",
            edgeSize = 8,
            insets = { left = 2, right = 2, top = 2, bottom = 2 }
        })
        
        local rgb = colorRGB[k]
        btn:SetBackdropColor(rgb[1], rgb[2], rgb[3], 0.25)
        btn:SetBackdropBorderColor(0.2, 0.2, 0.2, 0.8)

        local dot = btn:CreateTexture(nil, "OVERLAY")
        dot:SetSize(12, 12)
        dot:SetPoint("LEFT", btn, "LEFT", 8, 0)
        dot:SetColorTexture(rgb[1], rgb[2], rgb[3], 1)

        local text = btn:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
        text:SetPoint("LEFT", dot, "RIGHT", 6, 0)
        text:SetText(k:upper())

        btn:SetScript("OnClick", function()
            SelectColor(k)
        end)

        table.insert(colorButtons, btn)
        yOffset = yOffset - 28
    end

    f:Hide()
end

-- Deduplicador y Activador de Colores para Hechizos
local recentSpells = {}

local function stripAccents(str)
    if not str then return "" end
    str = string.gsub(str, "á", "a")
    str = string.gsub(str, "é", "e")
    str = string.gsub(str, "í", "i")
    str = string.gsub(str, "ó", "o")
    str = string.gsub(str, "ú", "u")
    str = string.gsub(str, "ü", "u")
    str = string.gsub(str, "Á", "a")
    str = string.gsub(str, "É", "e")
    str = string.gsub(str, "Í", "i")
    str = string.gsub(str, "Ó", "o")
    str = string.gsub(str, "Ú", "u")
    str = string.gsub(str, "Ü", "u")
    return str
end

local function TriggerSpellVisual(spellName)
    local now = GetTime()
    if recentSpells[spellName] and (now - recentSpells[spellName]) < 0.15 then
        return -- Evitar doble disparo de color para el mismo hechizo en 150ms
    end
    recentSpells[spellName] = now

    if spellName and GiftuberHelperDB then
        local cleanName = stripAccents(string.lower(spellName))
        for colorKey, spellList in pairs(GiftuberHelperDB) do
            for pattern in string.gmatch(spellList, "([^,]+)") do
                -- Limpiar espacios en blanco y minúsculas
                pattern = string.gsub(pattern, "^%s*(.-)%s*$", "%1")
                local cleanPattern = stripAccents(string.lower(pattern))
                if cleanPattern ~= "" and string.find(cleanName, cleanPattern, 1, true) then
                    local rgb = colorRGB[colorKey]
                    if rgb then
                        ShowColor(rgb[1], rgb[2], rgb[3])
                        return
                    end
                end
            end
        end
    end
end

-- Manejo de Eventos
local eventFrame = CreateFrame("Frame")
eventFrame:RegisterEvent("ADDON_LOADED")
eventFrame:RegisterEvent("UNIT_SPELLCAST_SUCCEEDED")

eventFrame:SetScript("OnEvent", function(self, event, ...)
    if event == "ADDON_LOADED" then
        local addonName = ...
        if addonName == "GiftuberHelper" then
            GiftuberHelperDB = GiftuberHelperDB or {}
            for k, v in pairs(defaultSettings) do
                if GiftuberHelperDB[k] == nil then
                    GiftuberHelperDB[k] = v
                end
            end
            CreateConfigMenu()
            SelectColor("red")
        end
    elseif event == "UNIT_SPELLCAST_SUCCEEDED" then
        local unit, castGUID, spellID = ...
        if unit == "player" then
            local spellName
            if C_Spell and C_Spell.GetSpellInfo then
                local info = C_Spell.GetSpellInfo(spellID)
                spellName = info and info.name
            else
                spellName = GetSpellInfo(spellID)
            end
            if spellName then
                TriggerSpellVisual(spellName)
            end
        end
    end
end)

-- Comandos Slash
SLASH_GIFTUBER1 = "/gt"
SLASH_GIFTUBER2 = "/giftuber"
SlashCmdList["GIFTUBER"] = function(msg)
    if not GiftuberHelperConfigFrame then
        CreateConfigMenu()
    end
    if GiftuberHelperConfigFrame:IsShown() then
        GiftuberHelperConfigFrame:Hide()
    else
        GiftuberHelperConfigFrame:Show()
        SelectColor(selectedColorKey)
    end
end

print("|cff00ff00[Giftuber Helper]|r Addon cargado. Escribe /gt para configurar hechizos.")
