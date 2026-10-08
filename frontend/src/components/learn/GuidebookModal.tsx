"use client";

import useSWR from "swr";

import { CloseIcon, SpeakerIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import { guidebookKey } from "@/lib/api";
import { speak, useSpeechAvailability } from "@/lib/audio";
import { unitColor } from "@/lib/theme";
import type { Guidebook, Unit } from "@/lib/types";

function ListenButton({ text }: { text: string }) {
  return (
    <button
      aria-label={`Listen to ${text}`}
      onClick={() => speak(text, "es")}
      className="shrink-0 text-macaw transition-transform hover:scale-110 active:scale-95"
    >
      <SpeakerIcon size={24} />
    </button>
  );
}

/** The unit's key phrases and vocabulary, built by the API from the unit's own exercises. */
export function GuidebookModal({ unit, onClose }: { unit: Unit | null; onClose: () => void }) {
  const { data, error } = useSWR<Guidebook>(unit ? guidebookKey(unit.id) : null);
  const canHear = useSpeechAvailability("es") !== "unavailable";
  const color = unitColor(unit?.color ?? "green");

  return (
    <Modal open={unit !== null} onClose={onClose} className="!max-w-[640px] !p-0" labelledBy="guidebook-title">
      {unit && (
        <>
          <header className="relative px-6 py-6 text-white sm:px-8" style={{ backgroundColor: color.base }}>
            <p className="label-caps text-[13px] text-white/75">
              Unit {unit.order_index + 1} guidebook
            </p>
            <h2 id="guidebook-title" className="mt-1 pr-10 text-[25px] font-extrabold leading-tight">
              {unit.title}
            </h2>
            <p className="mt-2 text-[17px] font-semibold text-white/90">{unit.description}</p>
            <button
              aria-label="Close guidebook"
              onClick={onClose}
              className="absolute right-5 top-5 rounded-lg p-1 text-white/80 hover:text-white"
            >
              <CloseIcon size={20} />
            </button>
          </header>

          <div className="px-6 py-6 sm:px-8">
            {error && (
              <p className="text-[17px] font-semibold text-ink-soft">
                The guidebook could not be loaded. Please try again.
              </p>
            )}
            {!data && !error && <p className="label-caps text-[15px] text-muted">Loading...</p>}
            {data && (
              <>
                <h3 className="label-caps mb-3 text-[15px] text-muted">Key phrases</h3>
                <ul className="card divide-y-2 divide-line">
                  {data.phrases.map((phrase) => (
                    <li key={phrase.text} className="flex items-center gap-4 px-4 py-3">
                      {canHear && <ListenButton text={phrase.text} />}
                      <div className="min-w-0">
                        <p className="text-[19px] font-extrabold" lang="es">
                          {phrase.text}
                        </p>
                        <p className="text-[17px] font-semibold text-ink-soft">{phrase.translation}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <h3 className="label-caps mb-3 mt-8 text-[15px] text-muted">Words</h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {data.words.map((word) => (
                    <li key={word.text}>
                      <button
                        onClick={() => speak(word.text, "es")}
                        className="tile flex h-full w-full flex-col items-center gap-1 px-3 py-4 text-center hover:bg-surface"
                      >
                        {word.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/images/vocab/${word.image}.svg`}
                            alt=""
                            className="mb-1 h-12 w-12 object-contain"
                            draggable={false}
                          />
                        )}
                        <span className="text-[17px] font-extrabold" lang="es">
                          {word.text}
                        </span>
                        <span className="text-[15px] font-semibold text-ink-soft">
                          {word.translation}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
