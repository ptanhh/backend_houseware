import { OrderModel } from "../models/OrderModel.js";
import expressAsyncHandler from "express-async-handler";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const createOrder = expressAsyncHandler(async (req, res) => {
  if (req.body.orderItems.length === 0) {
    res.status(400).send({ message: "cart is emty" });
  } else {
    const order = new OrderModel({
      order_code: "",
      to_ward_code: req.body.to_ward_code,
      to_district_id: req.body.to_district_id,
      cancelOrder: false,

      orderItems: req.body.orderItems,
      shippingAddress: {
        province: req.body.shippingAddress.province,
        district: req.body.shippingAddress.district,
        ward: req.body.shippingAddress.ward,
        detail: req.body.shippingAddress.more,
        name: req.body.shippingAddress.name,
        phone: req.body.shippingAddress.phone,
      },
      paymentMethod: req.body.paymentMethod,
      paymentResult: req.body.paymentResult
        ? {
            id: req.body.paymentResult.id,
            status: req.body.paymentResult.status,
            update_time: req.body.paymentResult.update_time,
            email_address: req.body.paymentResult.payer.email_address,
          }
        : "",
      totalPrice: req.body.totalPrice,
      status: req.body.status ? req.body.status : "pendding",
      name: req.body.name,
      user: req.body.user,
    });

    const createOrder = await order.save();
    res.status(201).send({ message: "new order created", order: createOrder });
  }
});

export const clientCancelOrder = expressAsyncHandler(async (req, res) => {
  const updateOrder = await OrderModel.findById({_id: req.params.id})

   if(updateOrder){
    updateOrder.cancelOrder = true
    await updateOrder.save()
   }
   res.send(updateOrder)
});

export const updateOrder = expressAsyncHandler(async (req, res) => {
  console.log('updateOrder')
  let updateOrder = await OrderModel.findById({ _id: req.params.id });
  console.log(updateOrder)

  if (updateOrder) {
    let items = [];
    updateOrder.orderItems.map((x) => {
      let item = {};
      item.name = x.name;
      item.quantity = parseInt(x.qty);
      item.price = x.salePrice;

      items.push(item);
    });

    const orderGhn = {
      "payment_type_id": 2,
      "required_note": "KHONGCHOXEMHANG",
      "from_name": "houseware",
      "from_phone": "0399249381",
      "from_address": "167 Dương Quảng Hàm",
      "from_ward_name": "Phường Quan Hoa",
      "from_district_name": "Quận Cầu Giấy",
      "from_province_name": "Hà Nội",
      "return_phone": "0399249381",
      "to_name": updateOrder.name,
      "to_phone": updateOrder.shippingAddress.phone,
      "to_address": "225 Quan Hoa, Cầu Giấy, Hà Nội",
      "to_ward_code": "1A0606",
      "weight": 200,
      "length": 1,
      "width": 19,
      "height": 10,
      "insurance_value": 10000,
      "service_id": 0,
      "service_type_id": 2,
      "items": items
    }

    updateOrder.order_code = req.params.id;
    await updateOrder.save();
    res.send(updateOrder);

    try {
      console.log('-----', orderGhn)
      const { data } = await axios.post(
        "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create",
        orderGhn,
        {
          headers: {
            'Content-Type': 'application/json',
            shop_id: process.env.SHOP_ID,
            token: process.env.TOKEN_GHN,
          },
        }
      );
      console.log({data})

      const order_code = data.data.order_code;

      updateOrder.order_code = order_code;
      await updateOrder.save();
      res.send(updateOrder);
    } catch (error) {
      console.log(error.response)
    }
  } else {
    res.send({ msg: "product not found" });
  }
});

export const PrintOrderGhn = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.findById({ _id: req.params.id });
  if (Order) {
    let token;
    try {
      const { data } = await axios.get(
        "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/a5/gen-token",
        {
          headers: {
            token: process.env.TOKEN_GHN,
          },
          params: {
            order_codes: Order.order_code,
          },
        }
      );
      token = data.data.token;
      Order.token = token;
      await Order.save();

      const result = await axios.get(
        `https://dev-online-gateway.ghn.vn/a5/public-api/printA5?token=${token}`,
        {
          headers: {
            Token: process.env.TOKEN_GHN,
          },
        }
      );
      res.send(result.config.url);
    } catch (error) {
    }
    
  } else {
    res.send({message: 'order not found'})
  }
});


export const GetAllOrder = expressAsyncHandler(async (req, res) => {
  //await OrderModel.remove()
  const Order = await OrderModel.find({}).sort({ createdAt: -1 });
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order" });
  }
});

export const GetAllOrderPaypal = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.find({ paymentMethod: "payOnline" }).sort({
    createdAt: -1,
  });
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order" });
  }
});

export const GetAllOrderPendding = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.find({
    $or: [{ status: "pendding" }, { paymentMethod: "payOnline" }],
  }).sort({
    createdAt: -1,
  });
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order" });
  }
});

export const GetAllOrderShipping = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.find({ status: "shipping" }).sort({
    createdAt: -1,
  });
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order" });
  }
});

export const GetAllOrderPaid = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.find({ status: "paid" }).sort({
    createdAt: -1,
  });
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order" });
  }
});

export const DeleteOrder = expressAsyncHandler(async (req, res) => {
  const deleteOrder = await OrderModel.findById({_id: req.params.id});

  if (deleteOrder) {
    await deleteOrder.remove();
    res.send({ message: "product deleted" });
  } else {
    res.send("error in delete order");
  }
});

export const ShippingProduct = expressAsyncHandler(async (req, res) => {
  const status = "shipping";
  const Order = await OrderModel.findById({ _id: req.params.id });
  if (Order) {
    Order.status = status;
    await Order.save();
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order" });
  }
});

export const PaidProduct = expressAsyncHandler(async (req, res) => {
  const status = "paid";
  const Order = await OrderModel.findByIdAndUpdate(
    { _id: req.params.id },
    { status: status }
  );
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order" });
  }
});

// --------------------    user

export const GetOrderByUser = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.find({ user: req.params.id }).sort({
    createdAt: -1,
  });
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order by user" });
  }
});

export const GetOrderPaypalByUser = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.find({
    user: req.params.id,
    paymentMethod: "payOnline",
  }).sort({ createdAt: -1 });
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order by user" });
  }
});

export const GetOrderPenddingByUser = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.find({
    user: req.params.id,
    status: "pendding",
  }).sort({ createdAt: -1 });
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order by user" });
  }
});

export const GetOrderShippingByUser = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.find({
    user: req.params.id,
    status: "shipping",
  }).sort({ createdAt: -1 });
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order by user" });
  }
});

export const GetOrderPaidByUser = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.find({
    user: req.params.id,
    status: "paid",
  }).sort({ createdAt: -1 });
  if (Order) {
    res.send(Order);
  } else {
    res.status(401).send({ message: "no order by user" });
  }
});

export const GetAllOrderInAMonth = expressAsyncHandler(async (req, res) => {
  const Order = await OrderModel.find({
    createdAt: {
      $gte: new Date(2024, 3, 11),
      $lt: new Date(2024, 3, 16),
    },
  });

  if (Order) {
    res.send(Order);
  } else {
    res.status(400).send({ message: "no product in a month" });
  }
});
const extractMonth = (dateString) => {
  const date = new Date(dateString);
  return date.getMonth(); 
};

export const GetDoanhThu = expressAsyncHandler(async (req, res) => {
  const data = await OrderModel.aggregate([
      {
          $match: {
              cancelOrder: false
          }
      },
      {
        $project: {
          _id: 0,
          totalPrice: 1,
          createdAt: 1
        }
      }
  ]);
  if (data.length === 0) {
    res.status(404).send({ message: 'No data found for the specified criteria.' });
} else {
  const monthlyRevenue = Array(12).fill(0);
  data.forEach(item => {
    const monthIndex = extractMonth(item.createdAt);  
    monthlyRevenue[monthIndex] += item.totalPrice; 
  });

    res.send(monthlyRevenue);
}
});

export const GetDoanhThuThang = expressAsyncHandler(async (req, res) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  
  const data = await OrderModel.aggregate([
      {
          $match: {
              cancelOrder: false,
              createdAt: {
                  $gte: new Date(currentDate.getFullYear(), currentMonth, 1), 
                  $lt: new Date(currentDate.getFullYear(), currentMonth + 1, 1)
              }
          }
      },
      {
          $project: {
              _id: 0,
              totalPrice: 1
          }
      }
  ]);
  
  let currentMonthRevenue = 0;

  data.forEach(item => {
      currentMonthRevenue += item.totalPrice;
  });

  res.send({ currentMonthRevenue });
});

