import { notFound } from 'next/navigation';
import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetProduct } from '@/application/use-cases/products/GetProduct';
import { UpdateProduct } from '@/application/use-cases/products/UpdateProduct';
import { DeleteProduct } from '@/application/use-cases/products/DeleteProduct';
import { ProductEditForm } from '@/presentation/components/seller/ProductEditForm';
import type { UpdateProductDTO } from '@/application/dtos/ProductDTO';

interface EditProductPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

/**
 * Edit Product Page
 *
 * Server component that fetches the product and passes to client form.
 */
export default async function EditProductPage({ params }: EditProductPageProps) {
  const { locale, id: productId } = await params;

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);

  // Fetch product from database
  const supabase = await createClient();
  const { productRepository } = createRepositories(supabase);

  const getProductUseCase = new GetProduct(productRepository);
  const result = await getProductUseCase.execute({ productId });

  // Product not found or doesn't belong to this seller
  if (!result.product || result.product.sellerId !== seller.id) {
    notFound();
  }

  // Capture seller ID for server actions
  const sellerId = seller.id;

  // Server action for updating product
  async function updateProduct(data: UpdateProductDTO) {
    'use server';

    const supabaseServer = await createClient();
    const repos = createRepositories(supabaseServer);

    const updateUseCase = new UpdateProduct(repos.productRepository);
    const updateResult = await updateUseCase.execute({
      productId,
      sellerId,
      updates: data,
    });

    if (!updateResult.success) {
      return { success: false, error: updateResult.error || 'Failed to update product' };
    }

    return { success: true };
  }

  // Server action for deleting product
  async function deleteProduct() {
    'use server';

    const supabaseServer = await createClient();
    const repos = createRepositories(supabaseServer);

    const deleteUseCase = new DeleteProduct(repos.productRepository);
    const deleteResult = await deleteUseCase.execute({
      productId,
      sellerId,
    });

    if (!deleteResult.success) {
      return { success: false, error: deleteResult.error || 'Failed to delete product' };
    }

    return { success: true };
  }

  return (
    <ProductEditForm
      product={result.product}
      locale={locale}
      updateAction={updateProduct}
      deleteAction={deleteProduct}
    />
  );
}
