// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MMCToken.sol";

contract CourseMarket is Ownable {
    // YiDeng代币合约实例
    MMCToken public mmcToken;

    constructor(address payable _mmcToken) Ownable(msg.sender) {
        mmcToken = MMCToken(_mmcToken);
    }

    // 课程结构体定义
    struct Course {
        string web2CourseId; // Web2平台的课程ID
        string name; // 课程名称
        uint256 price; // 课程价格(MMC代币)
        bool isActive; // 课程是否可购买
        address creator; // 课程创建者地址
    }

    // 存储所有课程的映射：courseId => Course
    mapping(uint256 => Course) public courses;

    // web2CourseId到courseId的映射关系
    mapping(string => uint256) public web2ToCourseId;

    // 用户购买记录映射：用户地址 => courseId => 是否购买
    mapping(address => mapping(uint256 => bool)) public userCourses;

    // 课程总数计数器
    uint256 public courseCount;

    // 定义事件，记录课程购买
    event CoursePurchased(
        address indexed buyer,
        uint256 indexed courseId,
        string web2CourseId
    );

    /**
     * @notice 使用web2CourseId购买课程
     * @param web2CourseId Web2平台的课程ID
     * @dev 用户通过Web2课程ID购买课程，自动查找对应的链上课程ID
     */
    function purchaseCourse(string memory web2CourseId) external {
        // 获取链上课程ID
        uint256 courseId = web2ToCourseId[web2CourseId];

        // 确保课程存在
        require(courseId > 0, "Course does not exist");

        // 获取课程信息
        Course memory course = courses[courseId];

        // 确保课程处于可购买状态
        require(course.isActive, "Course not active");

        // 确保用户未购买过该课程
        require(!userCourses[msg.sender][courseId], "Already purchased");

        // 确保web2CourseId匹配
        require(
            keccak256(abi.encodePacked(course.web2CourseId)) ==
                keccak256(abi.encodePacked(web2CourseId)),
            "Course ID mismatch"
        );

        // 调用YD代币合约的transferFrom函数，转移代币给课程创建者
        require(
            mmcToken.transferFrom(
                msg.sender, // 从购买者账户
                course.creator, // 转给课程创建者
                course.price // 转移课程价格对应的代币数量
            ),
            "Transfer failed"
        );

        // 记录购买状态
        userCourses[msg.sender][courseId] = true;

        // 触发购买事件
        emit CoursePurchased(msg.sender, courseId, web2CourseId);
    }

    /**
     * @notice 检查用户是否已购买课程
     * @param user 用户地址
     * @param web2CourseId Web2平台的课程ID
     * @return bool 是否已购买
     */
    function hasCourse(
        address user,
        string memory web2CourseId
    ) external view returns (bool) {
        uint256 courseId = web2ToCourseId[web2CourseId];
        require(courseId > 0, "Course does not exist");
        return userCourses[user][courseId];
    }

    /**
     * @notice 添加新课程
     * @param web2CourseId Web2平台的课程ID
     * @param name 课程名称
     * @param price 课程价格(YD代币)
     */
    function addCourse(
        string memory web2CourseId,
        string memory name,
        uint256 price
    ) external onlyOwner {
        require(price > 0, "Price must be greater than 0");
        require(bytes(name).length > 0, "Course name cannot be empty");
        // 确保web2CourseId不为空
        require(
            bytes(web2CourseId).length > 0,
            "Web2 course ID cannot be empty"
        );
        // 确保该web2CourseId尚未添加
        require(web2ToCourseId[web2CourseId] == 0, "Course already exists");

        // 递增课程计数器
        courseCount++;

        // 创建新课程
        courses[courseCount] = Course({
            web2CourseId: web2CourseId,
            name: name,
            price: price,
            isActive: true,
            creator: msg.sender
        });

        // 建立web2CourseId到courseId的映射关系
        web2ToCourseId[web2CourseId] = courseCount;
    }

    // 更新课程状态
    function updateCourseStatus(
        uint256 courseId,
        bool isActive
    ) external onlyOwner {
        require(courseId > 0 && courseId <= courseCount, "Invalid course ID");
        courses[courseId].isActive = isActive;
    }

    // 更新课程价格
    function updateCoursePrice(
        uint256 courseId,
        uint256 newPrice
    ) external onlyOwner {
        require(courseId > 0 && courseId <= courseCount, "Invalid course ID");
        require(newPrice > 0, "Price must be greater than 0");
        courses[courseId].price = newPrice;
    }

    // /**
    //  * @notice 获取用户购买的所有课程
    //  * @param user 用户地址
    //  * @return 课程信息数组，包含课程ID和详细信息
    //  */
    function getUserPurchasedCourses(
        address user
    )
        external
        view
        returns (uint256[] memory courseIds, Course[] memory courseDetails)
    {
        // 首先计算用户购买的课程数量
        uint256 purchaseCount = 0;
        for (uint256 i = 1; i <= courseCount; i++) {
            if (userCourses[user][i]) {
                purchaseCount++;
            }
        }

        // 创建返回数组
        courseIds = new uint256[](purchaseCount);
        courseDetails = new Course[](purchaseCount);

        // 填充数组
        uint256 currentIndex = 0;
        for (uint256 i = 1; i <= courseCount; i++) {
            if (userCourses[user][i]) {
                courseIds[currentIndex] = i;
                courseDetails[currentIndex] = courses[i];
                currentIndex++;
            }
        }

        return (courseIds, courseDetails);
    }

    // 分页获取课程列表
    function getCoursesByPage(
        uint256 page,
        uint256 pageSize
    ) external view returns (Course[] memory, uint256) {
        require(pageSize > 0, "Page size must be greater than 0");
        
        uint256 startIndex = page * pageSize;
        require(startIndex <= courseCount, "Page out of bounds");
        
        // 计算实际返回的数量
        uint256 returnSize = pageSize;
        if (startIndex + pageSize > courseCount) {
            returnSize = courseCount - startIndex;
        }
        
        // 创建返回数组
        Course[] memory result = new Course[](returnSize);
        
        // 填充数组
        for (uint256 i = 0; i < returnSize; i++) {
            uint256 courseId = startIndex + i + 1; // courseId 从1开始
            result[i] = courses[courseId];
        }
        
        // 返回课程数组和总数
        return (result, courseCount);
    }
}
