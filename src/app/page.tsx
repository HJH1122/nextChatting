import { Button } from "@/components/ui/button";
import styles from "./page.module.scss"

function Home() {
	return <div className={styles.container}>
		<div className={styles.container__onBoarding}>
			<span className={styles.container__onBoarding__title}>How to Start</span>
			<div className={styles.container__onBoarding__steps}>
				<span>1. Create Page</span>
				<span>2. Add boards to Page</span>
			</div>
			<Button variant={"outline"} className="w-full bg-transparent text-orange-500 border-orange-400 hover:bg-orange-50 hover:text-orange-500">Add New Page</Button>
		</div>
	</div>

}

export default Home;