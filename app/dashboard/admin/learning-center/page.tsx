import { learningRepository } from "@/lib/repositories/learning-repository";
import { quizRepository } from "@/lib/repositories/quiz-repository";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { ContentManager } from "@/components/admin/content-manager";
import { QuizzesManager } from "@/components/admin/quizzes-manager";

export default async function LearningCenterAdminPage() {
  const [categories, content, quizzes] = await Promise.all([
    learningRepository.listCategories(),
    learningRepository.listAllContent(),
    quizRepository.listAll(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Learning Center</h1>
        <p className="text-sm text-muted-foreground">
          Manage categories, content, and quizzes. Applicants see anything marked &quot;Published&quot;.
        </p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoriesManager categories={categories} />
        </TabsContent>

        <TabsContent value="content">
          <ContentManager content={content} categories={categories} />
        </TabsContent>

        <TabsContent value="quizzes">
          <QuizzesManager quizzes={quizzes} categories={categories} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
