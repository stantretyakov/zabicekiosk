export type Client = {
  id: string;
  parentName: string;
  childName: string;
  phone?: string;
  telegram?: string;
  instagram?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = {
  items: T[];
  nextPageToken?: string;
};
