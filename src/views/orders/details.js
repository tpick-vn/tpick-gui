import {
    Grid,
    Box,
    Stack,
    Typography,
    Divider,
    Accordion as MuiAccordion,
    AccordionSummary as MuiAccordionSummary,
    AccordionDetails as MuiAccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import { useParams } from 'react-router';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as mainService from 'services/main.service';
import { sum, toLocalePrice } from 'utils/pricing-tool';

const Wrapper = ({ children, ...rest }) => (
    <Grid {...rest}>
        <Box sx={{ padding: 1, bgcolor: '#ffffff', borderRadius: 1 }}>{children}</Box>
    </Grid>
);

const Accordion = styled((props) => <MuiAccordion disableGutters elevation={0} square {...props} />)(() => ({
    '&:not(:last-child)': {
        borderBottom: 0
    },
    '&:before': {
        display: 'none'
    },
    borderRadius: 0
}));

const AccordionSummary = styled((props) => <MuiAccordionSummary {...props} />)(() => ({
    backgroundColor: 'transparent',
    border: '1px solid gainsboro',
    borderRadius: 0
}));

const AccordionDetails = styled(MuiAccordionDetails)(() => ({
    padding: 0,
    borderRadius: 0
}));

const OrderDetails = () => {
    const { orderId } = useParams();
    const user = useSelector((x) => x.auth?.user);
    const [order, setOrder] = useState({ subOrders: [] });
    const [mySubOrder, setMySubOrder] = useState({ owner: null, items: [], using: false, confirmed: false });
    const groupItemMap = order?.subOrders
        .map((subOrder) => subOrder.items.map((item) => ({ ...item, note: subOrder.note })))
        .flatMap((items) => items)
        .reduce((acc, item) => {
            const name = item.name?.trim();
            const note = item.note?.trim().toLowerCase();
            const key = `${name}_${note}`;

            if (acc[key]) {
                acc[key].quantity += item.quantity;
            } else {
                acc[key] = {
                    name,
                    note,
                    price: item.price,
                    quantity: item.quantity
                };
            }

            return acc;
        }, {});
    const groupItems = Object.values(groupItemMap)?.sort((a, b) => a.name.localeCompare(b.name));

    const fetchOrderDetails = useCallback(async () => {
        const order = await mainService.getOrderDetails(orderId);
        setOrder(order);

        const myConfirmedSubOrder = order?.subOrders?.find((x) => x.owner?.id === user?.id);
        if (myConfirmedSubOrder && !mySubOrder.using) {
            setMySubOrder({
                ...myConfirmedSubOrder,
                confirmed: true
            });
        }
    }, [mySubOrder.using, orderId, user?.id]);

    useEffect(() => {
        if (!user) return;

        setMySubOrder({ ...mySubOrder, owner: user });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        fetchOrderDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (order.isConfirm) return () => {};

        const interval = setInterval(fetchOrderDetails, 10000);

        return () => {
            clearInterval(interval);
        };
    }, [fetchOrderDetails, order.isConfirm]);

    if (!user) return null;

    return (
        <Grid container spacing={1}>
            <Wrapper item xs={12}>
                <Stack fontSize={15}>
                    <Box item lg={6} bgcolor="#f7f7f7" borderRadius={0} my={0.5}>
                        <Box bgcolor="gainsboro" py={1.5}>
                            <Typography variant="h5" textAlign="center">
                                Sao kê
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" p={1}>
                            <Typography variant="body1" component="div">
                                Số phần
                            </Typography>
                            <Typography variant="body1" component="div">
                                {sum(groupItems, (x) => x.quantity)}
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" p={1}>
                            <Typography variant="body1" component="div">
                                Giảm giá
                            </Typography>
                            <Typography variant="body1" component="div">
                                {toLocalePrice(0)}
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" p={1}>
                            <Typography variant="body1" component="div">
                                Ship
                            </Typography>
                            <Typography variant="body1" component="div">
                                {toLocalePrice(0)}
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" p={1}>
                            <Typography variant="body1" component="div" color="primary" fontWeight="bold">
                                Tổng
                            </Typography>
                            <Typography variant="body1" component="div" color="primary" fontWeight="bold">
                                {toLocalePrice(
                                    sum(order.subOrders, (subOrder) => sum(subOrder.items, (item) => item.price * item.quantity))
                                )}
                            </Typography>
                        </Box>
                    </Box>
                </Stack>
            </Wrapper>
            <Wrapper item xs={12} lg={6}>
                <Stack fontSize={15}>
                    <Box my={0.5}>
                        <Box bgcolor="gainsboro" py={1.5}>
                            <Typography variant="h5" textAlign="center">
                                Theo phần
                            </Typography>
                        </Box>
                        {groupItems.map((groupItem) => (
                            <Box
                                key={`${groupItem.name}${groupItem.note}`}
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                border="1px solid gainsboro"
                                p={1}
                            >
                                <Stack direction="row" display="flex" alignItems="center">
                                    <Typography variant="body" ml={0.5}>
                                        {`${groupItem.quantity} x ${groupItem.name}`}
                                    </Typography>
                                    {groupItem.note && (
                                        <Typography variant="body" ml={0.5} color="error">
                                            {`(${groupItem.note})`}
                                        </Typography>
                                    )}
                                </Stack>

                                <Typography variant="body" ml={0.5} color="primary">
                                    {`${toLocalePrice(groupItem.price * groupItem.quantity)}`}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Stack>
            </Wrapper>
            <Wrapper item xs={12} lg={6}>
                <Stack>
                    <Box bgcolor="#f7f7f7" my={0.5}>
                        <Box bgcolor="gainsboro" py={1.5}>
                            <Typography variant="h5" textAlign="center">
                                Theo người
                            </Typography>
                        </Box>
                        {order.subOrders?.map((subOrder) => (
                            <Accordion key={subOrder.owner.id}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box display="flex" alignItems="center">
                                        <Typography variant="h5">{subOrder.owner.name}</Typography>
                                        <Typography variant="subtitle1" ml={0.5} color="primary">
                                            {`(${sum(subOrder.items, (x) => x.quantity)}P - ${toLocalePrice(
                                                sum(subOrder.items, (x) => x.quantity * x.price)
                                            )})`}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ border: '1px solid gainsboro', borderTop: 'none' }}>
                                    {subOrder.items?.map((item) => (
                                        <Box key={item.name} display="flex" alignItems="center" justifyContent="space-between" p={1}>
                                            <Typography variant="body1" fontSize={15} component="div">
                                                {item.quantity} x {item.name}
                                            </Typography>
                                            <Typography variant="body1" fontSize={15} component="div">
                                                {toLocalePrice(item.quantity * item.price)}
                                            </Typography>
                                        </Box>
                                    ))}
                                    <Divider />
                                    <Divider />
                                    {!!subOrder?.note && (
                                        <Box display="flex" alignItems="center" justifyContent="space-between" p={1} color="red">
                                            <Typography variant="body1" fontSize={15} component="div">
                                                Note
                                            </Typography>
                                            <Typography variant="body1" fontSize={15} component="div">
                                                {subOrder?.note}
                                            </Typography>
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                </Stack>
            </Wrapper>
        </Grid>
    );
};

export default OrderDetails;