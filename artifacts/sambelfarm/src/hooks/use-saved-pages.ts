import { useState, useCallback, useRef } from "react";
import {
  useNotionQuery,
  useNotionUpdatePage,
  useNotionDeletePage,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { downloadScriptPDF } from "@/lib/pdf";
import {
  type NotionPage,
  getTitle,
  getRichText,
  getSelect,
  getNumber,
  getDate,
} from "@/lib/notion-helpers";

/**
 * Custom hook that manages the list of saved Notion pages.
 * Encapsulates loading, optimistic updates, and all CRUD handlers.
 */
export function useSavedPages() {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loaded, setLoaded] = useState(false);

  const notionQuery = useNotionQuery();
  const notionUpdate = useNotionUpdatePage();
  const notionDelete = useNotionDeletePage();
  const { toast } = useToast();

  // Keep a stable ref to the mutate function to avoid useEffect dependency issues
  const mutateFn = useRef(notionQuery.mutate);
  mutateFn.current = notionQuery.mutate;

  const fetchPages = useCallback((pageSize = 30) => {
    setLoaded(false);
    mutateFn.current(
      {
        data: {
          database_id: "",
          page_size: pageSize,
          sorts: [
            {
              timestamp: "last_edited_time",
              direction: "descending",
            } as unknown as Record<string, string>,
          ],
        },
      },
      {
        onSuccess: (data) => {
          setPages(
            (data as unknown as { results: NotionPage[] }).results ?? [],
          );
          setLoaded(true);
        },
        onError: () => setLoaded(true),
      },
    );
  }, []);

  // Apply optimistic local update to a single page's property
  const updatePageLocal = useCallback(
    (
      pageId: string,
      propKey: string,
      propValue: NotionPage["properties"][string],
    ) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? { ...p, properties: { ...p.properties, [propKey]: propValue } }
            : p,
        ),
      );
    },
    [],
  );

  const handleDateChange = useCallback(
    (page: NotionPage, newDate: string) => {
      updatePageLocal(page.id, "Tanggal", { date: { start: newDate } });
      notionUpdate.mutate(
        {
          pageId: page.id,
          data: {
            properties: {
              Tanggal: { date: { start: newDate } },
            } as Record<string, string>,
          },
        },
        {
          onSuccess: () => toast({ title: "Tanggal diperbarui" }),
          onError: () => {
            toast({ title: "Gagal update tanggal", variant: "destructive" });
            updatePageLocal(page.id, "Tanggal", {
              date: { start: getDate(page, "Tanggal") },
            });
          },
        },
      );
    },
    [notionUpdate, toast, updatePageLocal],
  );

  const handleToneChange = useCallback(
    (pageId: string, newTone: string) => {
      updatePageLocal(pageId, "Tone", { select: { name: newTone } });
      notionUpdate.mutate(
        {
          pageId,
          data: {
            properties: {
              Tone: { select: { name: newTone } },
            } as Record<string, string>,
          },
        },
        {
          onSuccess: () => toast({ title: `Tone diubah ke "${newTone}"` }),
          onError: () =>
            toast({ title: "Gagal update tone", variant: "destructive" }),
        },
      );
    },
    [notionUpdate, toast, updatePageLocal],
  );

  const handleStatusChange = useCallback(
    (pageId: string, newStatus: string) => {
      updatePageLocal(pageId, "Status Revisi", {
        select: { name: newStatus },
      });
      notionUpdate.mutate(
        {
          pageId,
          data: {
            properties: {
              "Status Revisi": { select: { name: newStatus } },
            } as Record<string, string>,
          },
        },
        {
          onSuccess: () => toast({ title: `Status diubah ke "${newStatus}"` }),
          onError: () =>
            toast({ title: "Gagal update status", variant: "destructive" }),
        },
      );
    },
    [notionUpdate, toast, updatePageLocal],
  );

  const handleDelete = useCallback(
    (page: NotionPage) => {
      setPages((prev) => prev.filter((p) => p.id !== page.id));
      notionDelete.mutate(
        { pageId: page.id },
        {
          onSuccess: () => toast({ title: "Script dihapus" }),
          onError: () => {
            setPages((prev) => [page, ...prev]);
            toast({ title: "Gagal menghapus script", variant: "destructive" });
          },
        },
      );
    },
    [notionDelete, toast],
  );

  const handlePublish = useCallback(
    (page: NotionPage) => {
      const prevStatus = getSelect(page, "Status Revisi");
      updatePageLocal(page.id, "Status Revisi", {
        select: { name: "Dipublikasi" },
      });
      notionUpdate.mutate(
        {
          pageId: page.id,
          data: {
            properties: {
              "Status Revisi": { select: { name: "Dipublikasi" } },
            } as Record<string, string>,
          },
        },
        {
          onSuccess: () => toast({ title: "Script dipublikasi!" }),
          onError: () => {
            toast({ title: "Gagal mempublikasi", variant: "destructive" });
            updatePageLocal(page.id, "Status Revisi", {
              select: { name: prevStatus },
            });
          },
        },
      );
    },
    [notionUpdate, toast, updatePageLocal],
  );

  const handleDownloadPDF = useCallback(
    (page: NotionPage, extra?: { analisisAI?: string; rekomendasi?: string }) => {
      downloadScriptPDF({
        topik: getTitle(page),
        judul: getRichText(page, "Judul"),
        platform: getSelect(page, "Platform"),
        jenisKonten: getSelect(page, "Jenis Konten"),
        tone: getSelect(page, "Tone"),
        tanggal: getDate(page, "Tanggal"),
        statusRevisi: getSelect(page, "Status Revisi"),
        script: getRichText(page, "Script"),
        skorViralitas: getNumber(page, "Skor Viralitas"),
        ...extra,
      });
    },
    [],
  );

  return {
    pages,
    setPages,
    loaded,
    fetchPages,
    handleDateChange,
    handleToneChange,
    handleStatusChange,
    handleDelete,
    handlePublish,
    handleDownloadPDF,
  };
}
