import { Button } from "@/components/ui/button";
import styles from "./SideNavigation.module.scss"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react";

function SideNavigation() {
	return <div className={styles.container}>
        <div className={styles.container__searchBox}>
            <Input type="text" placeholder="검색어를 입력해주세요." className="focus-visible:ring-0"/>
            <Button variant={"outline"} size="icon">
                <Search className="w-4 h-4" />
            </Button>
        </div>
        <div className={styles.container__buttonBox}>
            <Button variant={"outline"} className="w-full text-orange-500 border-orange-400 hover:bg-orange-50 hover:text-orange-500">Add New Page</Button>
        </div>
        <div className={styles.container__todos}>
            <span className={styles.container__todos__label}>Your To do</span>
        </div>
    </div>

}

export default SideNavigation;