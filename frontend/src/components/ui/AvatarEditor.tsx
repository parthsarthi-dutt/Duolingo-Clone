"use client";

import { useState } from "react";
import { UserAvatar, type AvatarConfig } from "./UserAvatar";
import { Button } from "./Button";
import clsx from "clsx";

const COLORS = [
  "#F5F5F5", "#C8C8C8", "#4A4A4A", "#F5E6FF", "#D2A8FF", "#8A4FFF",
  "#D9F2FF", "#8AE2FF", "#1CB0F6", "#D9FFEA", "#8AFFB6", "#00CD9C",
  "#F5FFD9", "#CEFF8A", "#58CC02", "#FFF5D9", "#FFCE8A", "#FF9600",
  "#FFE6E6", "#FFB3B3", "#FF4B4B", "#FFE6F5", "#FFB3E1", "#FF86D0",
];

const BODY_COLORS = [
  "#2C1814", "#3D241C", "#5C3826", "#7A4B36", "#9C6246", "#C18465",
  "#E0AC8D", "#FAD8C3", "#FFE5D6", "#FFEDDE", "#FFF4EC", "#58CC02",
];

const TABS = [
  { id: "bg", label: "Background" },
  { id: "body", label: "Body" },
  { id: "clothing", label: "Clothing" },
  { id: "glasses", label: "Glasses" },
] as const;

export function AvatarEditor({
  initialConfig,
  displayName,
  onSave,
  onCancel,
}: {
  initialConfig: string | null;
  displayName: string;
  onSave: (configStr: string) => void;
  onCancel: () => void;
}) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("bg");

  // Parse initial config or use defaults
  let parsed: AvatarConfig = {
    bg: "#F5F5F5",
    body: "#7A4B36",
    clothing: "#8A4FFF",
    glasses: "none",
    glassesColor: "#4A4A4A",
  };
  if (initialConfig?.startsWith("{")) {
    try {
      parsed = { ...parsed, ...JSON.parse(initialConfig) };
    } catch {}
  } else if (initialConfig) {
    // legacy hex code
    parsed.bg = initialConfig;
  }
  const [config, setConfig] = useState<AvatarConfig>(parsed);

  function update(key: keyof AvatarConfig, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function renderColorGrid(
    colors: string[],
    selected: string,
    onSelect: (c: string) => void
  ) {
    return (
      <div className="grid grid-cols-6 gap-3 py-4">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={clsx(
              "h-10 w-10 rounded-xl border-2 transition-transform hover:scale-110",
              selected === c ? "border-macaw scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: c, boxShadow: "0 2px 0 rgba(0,0,0,0.1)" }}
            aria-label={`Select color ${c}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-surface sm:flex-row flex-col">
      {/* Left side: Preview */}
      <div className="flex shrink-0 items-center justify-center p-8 sm:w-[400px]">
        <UserAvatar
          avatarConfig={JSON.stringify(config)}
          displayName={displayName}
          size={300}
        />
      </div>

      {/* Right side: Controls */}
      <div className="flex flex-1 flex-col bg-[#11191f] text-white">
        {/* Tabs */}
        <div className="flex gap-2 border-b-2 border-[#1f2933] p-4 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "label-caps whitespace-nowrap rounded-lg px-3 py-2 text-[14px]",
                activeTab === tab.id
                  ? "bg-macaw/20 text-macaw"
                  : "text-muted hover:bg-[#1f2933]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "bg" && (
            <div>
              <h3 className="text-[17px] font-extrabold">Background color</h3>
              {renderColorGrid(COLORS, config.bg, (c) => update("bg", c))}
            </div>
          )}

          {activeTab === "body" && (
            <div>
              <h3 className="text-[17px] font-extrabold">Skin tone</h3>
              {renderColorGrid(BODY_COLORS, config.body, (c) => update("body", c))}
            </div>
          )}

          {activeTab === "clothing" && (
            <div>
              <h3 className="text-[17px] font-extrabold">Clothing color</h3>
              {renderColorGrid(COLORS, config.clothing, (c) => update("clothing", c))}
            </div>
          )}

          {activeTab === "glasses" && (
            <div>
              <h3 className="text-[17px] font-extrabold">Glasses color</h3>
              {renderColorGrid(COLORS, config.glassesColor, (c) =>
                update("glassesColor", c)
              )}
              <h3 className="mt-6 text-[17px] font-extrabold">Glasses shape</h3>
              <div className="mt-4 flex gap-4">
                {["none", "round", "square"].map((shape) => (
                  <button
                    key={shape}
                    onClick={() => update("glasses", shape)}
                    className={clsx(
                      "flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 transition-colors",
                      config.glasses === shape
                        ? "border-macaw bg-macaw/10"
                        : "border-[#1f2933] hover:border-muted"
                    )}
                  >
                    <span className="text-[14px] font-extrabold capitalize">
                      {shape}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t-2 border-[#1f2933] p-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="blue" onClick={() => onSave(JSON.stringify(config))}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
