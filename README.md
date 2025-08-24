# Furniture Store E-commerce Template

A modern e-commerce storefront built with Next.js, integrated with Shopify for product management, and styled with Tailwind CSS and Tamagui. This template provides a robust foundation for building a high-performance online furniture store.

## Features

*   **Product Listing**: Browse and view furniture products with detailed descriptions and images.
*   **Product Details Page**: Dedicated pages for each product, showcasing variants, pricing, and "add to cart" functionality.
*   **Shopping Cart**: A persistent shopping cart to manage selected items.
*   **Category and Color Filtering**: Filter products by categories and available colors.
*   **Search Functionality**: Easily find products using a search bar.
*   **Responsive Design**: Optimized for various screen sizes, from mobile to desktop.
*   **Shopify Integration**: Seamlessly pulls product data from a Shopify store.
*   **Performance**: Built with Next.js for fast page loads and a great user experience.
*   **Styling**: Modern and customizable UI with Tailwind CSS and Tamagui.

## Technologies Used

*   **Next.js**: React framework for building performant web applications.
*   **React**: JavaScript library for building user interfaces.
*   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
*   **Tamagui**: A universal UI kit for React Native and Web.
*   **Shopify Storefront API**: For fetching product data.
*   **TypeScript**: For type-safe code.

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or higher)
*   npm or Yarn or Bun (Bun is used in this project)
*   A Shopify store with products configured.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/timonjagi/furniture-store.git
    cd furniture-store
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

### Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables:

```env
# Shopify Storefront API
SHOPIFY_STORE_DOMAIN="YOUR_SHOPIFY_STORE_DOMAIN.myshopify.com"
SHOPIFY_STOREFRONT_ACCESS_TOKEN="YOUR_SHOPIFY_STOREFRONT_ACCESS_TOKEN"
```

*   `SHOPIFY_STORE_DOMAIN`: Your Shopify store's domain (e.g., `your-store-name.myshopify.com`).
*   `SHOPIFY_STOREFRONT_ACCESS_TOKEN`: A Storefront Access Token generated from your Shopify admin.

### Running the Development Server

To start the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

This project is designed to be easily deployed to platforms like Vercel.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/toruslabs/v0-shopify-ecommerce-template)

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is open-source and available under the MIT License.
