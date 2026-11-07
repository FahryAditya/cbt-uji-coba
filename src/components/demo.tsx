"use client";

import { Rocket } from "lucide-react";
import { motion } from "motion/react";
import { z } from "zod";
import { useCounterStore } from "@/stores/counter";

const schema = z.object({ name: z.string().min(1) });
schema.parse({ name: "Next" });

export default function Demo() {
  const { count, increment } = useCounterStore();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-4 text-center"
    >
      <Rocket size={48} className="mx-auto" />
      <h1 className="text-4xl font-bold">Next.js Project Siap</h1>
      <button
        onClick={increment}
        className="rounded-lg bg-white px-4 py-2 text-black"
      >
        Klik: {count}
      </button>
    </motion.div>
  );
}
