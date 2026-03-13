import { Router } from "express"
import userRouter from "../resources/user/user.router"
import authRouter from "../resources/auth/auth.router"
import languageRouter from "../resources/language/language.router"
import analysisRouter from "../resources/analysis/analysis.router"
import savedAnalysisRouter from "../resources/savedAnalysis/savedAnalysis.router"
import adminRouter from "../resources/admin/admin.router"
import articleRouter from "../resources/article/article.router"
const router = Router()

router.use("/users", userRouter)
router.use("/auth", authRouter)
router.use("/language", languageRouter)
router.use("/analysis", analysisRouter)
router.use("/saved-analysis", savedAnalysisRouter)
router.use("/admin", adminRouter)
router.use("/articles", articleRouter)
export default router