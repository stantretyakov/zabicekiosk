export interface Client {
  id: string;
  parentName: string;
  childName: string;
  phone?: string;
  telegram?: string;
  instagram?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paginated<T> {
  items: T[];
  nextPageToken?: string;
}
