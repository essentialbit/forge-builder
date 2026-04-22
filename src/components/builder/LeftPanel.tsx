"use client";

import { useState } from "react";
import { SectionLibrary } from "@/components/builder/SectionLibrary";
import { PageTree } from "@/components/builder/PageTree";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Layers, FileText } from "lucide-react";

export function LeftPanel() {
  const [activeTab, setActiveTab] = useState("sections");

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
      <Tabs value={activeTab} onChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-slate-800 bg-slate-900 p-0 h-auto">
          <TabsTrigger
            value="sections"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent py-3"
          >
            <Layers className="w-4 h-4 mr-2" />
            Sections
          </TabsTrigger>
          <TabsTrigger
            value="pages"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent py-3"
          >
            <FileText className="w-4 h-4 mr-2" />
            Pages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="flex-1 overflow-y-auto">
          <SectionLibrary />
        </TabsContent>

        <TabsContent value="pages" className="flex-1 overflow-y-auto">
          <PageTree />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
