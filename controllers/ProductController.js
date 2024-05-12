import { ProductModel } from '../models/ProductModel.js'
import expressAsyncHandler from 'express-async-handler'
import { PinComment } from '../untils/until.js'
import cloudinary from 'cloudinary'


export const getAllProduct = expressAsyncHandler(async (req, res) => {
    // await ProductModel.remove()
    // const product = await ProductModel.insertMany(data.products)
    // ProductModel.find()
    //     .then(product => res.send(product))
    //     .catch(err => console.log(err))
    const products = await ProductModel.find({})
    res.send(products)
})

export const findProductById = expressAsyncHandler(async (req, res) => {
    const product = await ProductModel.findById({ _id: req.params.id })

    if (product) {
        res.send(product)
    } else {
        res.send({ message: 'product not found' })
    }
})

export const filterProductByType = expressAsyncHandler(async (req, res) => {
    // ProductModel.find({type: req.params.type})
    //     .then(product => res.send(product))
    //     .catch(err => console.log(err))

    const filterProductByType = await ProductModel.find({ type: req.params.type }).limit(5)
    res.send(filterProductByType)
})

export const filterProductByRandomField = expressAsyncHandler(async (req, res) => {
    const products = await ProductModel.find(req.body)
    if (products) {
        res.send(products)
    } else {
        res.send({ message: 'product not found' })
    }
})

export const AddProduct = expressAsyncHandler(async (req, res) => {
    const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "dev_setups",
    });

    const product = new ProductModel({
        name: req.body.name,
        price: req.body.price,
        salePrice: req.body.salePrice,
        amount: req.body.amount,
        type: req.body.type,
        image: result.secure_url,
        cloudinary_id: result.public_id,
        rating: 0,

    });
    const newProduct = await product.save();

    if (newProduct) {
        return res
            .status(201)
            .send({ message: "New Product Created", data: newProduct });
    } else {
        res.send("error add product");
    }
});

export const UpdateProduct = expressAsyncHandler(async (req, res) => {
    const product = await ProductModel.findById(req.body._id);

    if (!product) {
        return res.status(404).send("Product not found");
    }

    if (product.cloudinary_id) {
        await cloudinary.uploader.destroy(product.cloudinary_id);
    }

    let result;
    if (req.file) {
        result = await cloudinary.uploader.upload(req.file.path);
    }

    product.name = req.body.name;
    product.amount = req.body.amount;
    product.price = req.body.price;
    product.salePrice = req.body.salePrice;
    product.type = req.body.type;
    product.image = result?.secure_url || product.image;
    product.rating = 0;
    product.cloudinary_id = result?.public_id || product.cloudinary_id;

    const updatedProduct = await product.save();
    if (updatedProduct) {
        return res.send("Update success");
    } else {
        return res.status(500).send("Update failed");
    }
});


export const DeleteProduct = expressAsyncHandler(async (req, res) => {
    const deleteProduct = await ProductModel.findById(req.params.id)

    // await cloudinary.uploader.destroy(deleteProduct.cloudinary_id);

    if (deleteProduct) {
        await deleteProduct.remove()
        res.send({ message: 'product deleted' })
    } else {
        res.send('error in deletetion')
    }
})

export const SearchProduct = expressAsyncHandler(async (req, res) => {
    const name = req.query.name
    const product = await ProductModel.find({ name: { $regex: name, $options: 'i' } })

    product.length > 0 ? res.send(product) : res.send({ message: ' khong tim thay sp' })
})

export const paginationProduct = expressAsyncHandler(async (req, res) => {
    var perPage = 15
    var page = req.params.page || 1
    ProductModel
        .find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function (err, products) {
            ProductModel.countDocuments().exec(function (err, count) {
                if (err) return next(err)
                res.send({
                    products: products,
                    current: page,
                    pages: Math.ceil(count / perPage)
                })
            })
        })
})

export const RateProduct = expressAsyncHandler(async (req, res) => {
    const product = await ProductModel.findById(req.params.id)
    if (product) {
        const existsUser = product.reviews.find(x => x.name === req.body.name)
        if (existsUser) {
            res.send({ message: 'ban da danh gia san pham nay' })
        } else {
            product.reviews.push(req.body)
            const updateProduct = await product.save()
            res.send(updateProduct)
        }

    } else {
        res.status(400).send({ message: 'product not found' })
    }

})

export const CommentProduct = expressAsyncHandler(async (req, res) => {
    const product = await ProductModel.findById(req.params.id)
    if (product) {
        product.comments.push(req.body)
        const updateCommentProduct = await product.save()
        res.send(updateCommentProduct)
    } else {
        res.status(400).send({ message: 'product not found' })
    }

})

export const RepCommentProduct = expressAsyncHandler(async (req, res) => {
    const product = await ProductModel.findById(req.params.id)
    if (product) {
        const indexComment = product.comments.findIndex(item => item._id == req.body.idComment)
        product.comments[indexComment].replies.push(req.body)

        await product.save()
        res.send(product)
    } else {
        res.status(400).send({ message: 'product not found' })
    }

})

export const PinCommentProduct = expressAsyncHandler(async (req, res) => {
    const product = await ProductModel.findById(req.params.id)
    if (product) {
        const indexComment = product.comments.findIndex(item => item._id == req.body.idComment)
        product.comments[indexComment] = req.body
        PinComment(product.comments, indexComment, 0)

        await product.save()
        res.send(product)
    } else {
        res.status(400).send({ message: 'product not found' })
    }
})

export const BlogProduct = expressAsyncHandler(async (req, res) => {
    const product = await ProductModel.findById({ _id: req.params.id })

    if (product) {
        product.blog = req.body.blogContent
        await product.save()
        res.send(product)
    } else {
        res.send({ message: 'product not found' })
    }
})

export const countAllProducts = expressAsyncHandler(async (req, res) => {
    try {
        const count = await ProductModel.countDocuments({});
        res.json({count})
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error counting products' });
    }
});
