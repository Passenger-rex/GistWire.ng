import { Article } from "../types";
import { db } from "./firebase";
import { collection, doc, getDocs, getDoc, setDoc, query, where, updateDoc, increment, deleteDoc } from "firebase/firestore";

export interface CommentType {
  id: string;
  articleId: string;
  name: string;
  text: string;
  date: string;
  likes: number;
}

export const getArticles = async (): Promise<Article[]> => {
  const snapshot = await getDocs(collection(db, "articles"));
  return snapshot.docs.map(doc => doc.data() as Article);
};

export const saveArticles = async (articles: Article[]) => {
  for (const article of articles) {
    await saveArticle(article);
  }
};

export const getArticle = async (id: string): Promise<Article | undefined> => {
  const docRef = doc(db, "articles", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as Article;
  }
  return undefined;
};

export const saveArticle = async (article: Article) => {
  const docRef = doc(db, "articles", article.id);
  await setDoc(docRef, article);
};

export const getArticleBySlug = async (slug: string): Promise<Article | undefined> => {
  const q = query(collection(db, "articles"), where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as Article;
  }
  return undefined;
};

export const incrementViews = async (slug: string) => {
  const q = query(collection(db, "articles"), where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    await updateDoc(docRef, {
      views: increment(1)
    });
  }
};

export const likeArticle = async (slug: string, isLiking: boolean = true) => {
  const q = query(collection(db, "articles"), where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    await updateDoc(docRef, {
      likes: increment(isLiking ? 1 : -1)
    });
  }
};

export const deleteArticle = async (id: string) => {
  await deleteDoc(doc(db, "articles", id));
};

export const getComments = async (articleId: string): Promise<CommentType[]> => {
  const q = query(collection(db, "comments"), where("articleId", "==", articleId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as CommentType).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const saveComment = async (comment: CommentType) => {
  const docRef = doc(db, "comments", comment.id);
  await setDoc(docRef, comment);
};

export const likeComment = async (commentId: string, isLiking: boolean = true) => {
  const docRef = doc(db, "comments", commentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    await updateDoc(docRef, {
      likes: increment(isLiking ? 1 : -1)
    });
  }
};
