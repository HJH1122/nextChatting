import { Button } from "@/components/ui/button";
import styles from "./SideNavigation.module.scss"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react";

function SideNavigation() {
	return <div className={styles.container}>
        <div className={styles.container__todos}>
            <span className={styles.container__todos__label}>HJH 채팅 프로그램</span>
        </div>
    </div>

}

export default SideNavigation;