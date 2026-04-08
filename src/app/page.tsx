"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import styles from "./page.module.scss";

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.container__onBoarding}>
        <span className={styles.container__onBoarding__title}>실시간 채팅</span>
        <Button
          onClick={() => router.push("/chat")}
          variant={"outline"}
          className="w-full bg-transparent text-orange-500 border-orange-400 hover:bg-orange-50 hover:text-orange-500"
        >
          채팅 시작하기
        </Button>
      </div>
    </div>
  );
}
